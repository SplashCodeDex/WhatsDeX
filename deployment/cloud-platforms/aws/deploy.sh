#!/bin/bash

# WhatsDeX AI Bot - AWS EKS Deployment Script
# Automated deployment to Amazon Web Services

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DEPLOYMENT_STRATEGY=${1:-"blue-green"}
IMAGE_TAG=${2:-"latest"}
CLUSTER_NAME=${3:-"whatsdx-production"}
REGION=${4:-"us-west-2"}

print_status() {
    echo -e "${BLUE}[AWS]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[AWS SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[AWS ERROR]${NC} $1"
}

# Check AWS CLI configuration
check_aws_config() {
    print_status "Checking AWS configuration..."
    
    if ! aws sts get-caller-identity &>/dev/null; then
        print_error "AWS credentials not configured"
        exit 1
    fi
    
    print_success "AWS credentials verified"
}

# Create or update EKS cluster
setup_eks_cluster() {
    print_status "Setting up EKS cluster: $CLUSTER_NAME"
    
    # Check if cluster exists
    if aws eks describe-cluster --name $CLUSTER_NAME --region $REGION &>/dev/null; then
        print_status "EKS cluster $CLUSTER_NAME already exists"
    else
        print_status "Creating EKS cluster $CLUSTER_NAME..."
        
        # Create cluster using eksctl
        eksctl create cluster \
            --name $CLUSTER_NAME \
            --region $REGION \
            --nodes 3 \
            --nodes-min 2 \
            --nodes-max 10 \
            --node-type m5.large \
            --with-oidc \
            --ssh-access \
            --ssh-public-key ~/.ssh/id_rsa.pub \
            --managed
        
        print_success "EKS cluster created successfully"
    fi
    
    # Update kubeconfig
    aws eks update-kubeconfig --region $REGION --name $CLUSTER_NAME
}

# Install necessary AWS controllers
install_aws_controllers() {
    print_status "Installing AWS controllers..."
    
    # Install AWS Load Balancer Controller
    print_status "Installing AWS Load Balancer Controller..."
    
    # Create IAM OIDC provider
    eksctl utils associate-iam-oidc-provider --region=$REGION --cluster=$CLUSTER_NAME --approve
    
    # Download IAM policy
    curl -o iam_policy.json https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.4.4/docs/install/iam_policy.json
    
    # Create IAM policy
    aws iam create-policy \
        --policy-name AWSLoadBalancerControllerIAMPolicy \
        --policy-document file://iam_policy.json || true
    
    # Create IAM role
    eksctl create iamserviceaccount \
        --cluster=$CLUSTER_NAME \
        --namespace=kube-system \
        --name=aws-load-balancer-controller \
        --role-name "AmazonEKSLoadBalancerControllerRole" \
        --attach-policy-arn=arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):policy/AWSLoadBalancerControllerIAMPolicy \
        --approve || true
    
    # Install controller using Helm
    helm repo add eks https://aws.github.io/eks-charts
    helm repo update
    
    helm upgrade --install aws-load-balancer-controller eks/aws-load-balancer-controller \
        -n kube-system \
        --set clusterName=$CLUSTER_NAME \
        --set serviceAccount.create=false \
        --set serviceAccount.name=aws-load-balancer-controller
    
    # Install EBS CSI Driver
    print_status "Installing EBS CSI Driver..."
    eksctl create iamserviceaccount \
        --name ebs-csi-controller-sa \
        --namespace kube-system \
        --cluster $CLUSTER_NAME \
        --attach-policy-arn arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy \
        --approve \
        --override-existing-serviceaccounts || true
    
    # Install EFS CSI Driver for shared storage
    print_status "Installing EFS CSI Driver..."
    kubectl apply -k "github.com/kubernetes-sigs/aws-efs-csi-driver/deploy/kubernetes/overlays/stable/?ref=master"
    
    print_success "AWS controllers installed successfully"
}

# Setup AWS-specific storage
setup_aws_storage() {
    print_status "Setting up AWS storage resources..."
    
    # Create EFS filesystem for shared storage
    print_status "Creating EFS filesystem..."
    
    VPC_ID=$(aws eks describe-cluster --name $CLUSTER_NAME --region $REGION --query "cluster.resourcesVpcConfig.vpcId" --output text)
    
    # Get VPC CIDR
    VPC_CIDR=$(aws ec2 describe-vpcs --vpc-ids $VPC_ID --query "Vpcs[0].CidrBlock" --output text --region $REGION)
    
    # Create security group for EFS
    EFS_SECURITY_GROUP=$(aws ec2 create-security-group \
        --group-name whatsdx-efs-sg \
        --description "Security group for WhatsDeX EFS" \
        --vpc-id $VPC_ID \
        --region $REGION \
        --query "GroupId" --output text 2>/dev/null || \
        aws ec2 describe-security-groups \
        --filters "Name=group-name,Values=whatsdx-efs-sg" "Name=vpc-id,Values=$VPC_ID" \
        --query "SecurityGroups[0].GroupId" --output text --region $REGION)
    
    # Add inbound rule for NFS
    aws ec2 authorize-security-group-ingress \
        --group-id $EFS_SECURITY_GROUP \
        --protocol tcp \
        --port 2049 \
        --cidr $VPC_CIDR \
        --region $REGION || true
    
    # Create EFS filesystem
    EFS_ID=$(aws efs create-file-system \
        --creation-token whatsdx-efs-$(date +%s) \
        --performance-mode generalPurpose \
        --tags Key=Name,Value=whatsdx-shared-storage \
        --region $REGION \
        --query "FileSystemId" --output text 2>/dev/null || \
        aws efs describe-file-systems \
        --query "FileSystems[?Tags[?Key=='Name' && Value=='whatsdx-shared-storage']].FileSystemId" \
        --output text --region $REGION | head -1)
    
    print_success "EFS filesystem created: $EFS_ID"
    
    # Create mount targets in each subnet
    SUBNET_IDS=$(aws eks describe-cluster --name $CLUSTER_NAME --region $REGION --query "cluster.resourcesVpcConfig.subnetIds" --output text)
    
    for subnet in $SUBNET_IDS; do
        aws efs create-mount-target \
            --file-system-id $EFS_ID \
            --subnet-id $subnet \
            --security-groups $EFS_SECURITY_GROUP \
            --region $REGION || true
    done
    
    # Create StorageClass for EFS
    cat > aws-efs-storageclass.yaml << EOF
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: efs-sc
provisioner: efs.csi.aws.com
parameters:
  provisioningMode: efs-ap
  fileSystemId: $EFS_ID
  directoryPerms: "700"
  gidRangeStart: "1000"
  gidRangeEnd: "2000"
  basePath: "/whatsdx"
EOF
    
    kubectl apply -f aws-efs-storageclass.yaml
    
    print_success "AWS storage setup completed"
}

# Deploy AWS-specific configurations
deploy_aws_configs() {
    print_status "Deploying AWS-specific configurations..."
    
    # Update image tags
    sed -i "s|:latest|:$IMAGE_TAG|g" deployment/kubernetes/*.yaml
    sed -i "s|storageClassName: fast-ssd|storageClassName: gp2|g" deployment/kubernetes/*.yaml
    
    # Create namespace with AWS annotations
    cat > aws-namespace.yaml << EOF
apiVersion: v1
kind: Namespace
metadata:
  name: whatsdx-ai
  labels:
    name: whatsdx-ai
    app: whatsdx-bot
    version: "$IMAGE_TAG"
    platform: aws
  annotations:
    aws.amazon.com/load-balancer-backend-protocol: http
---
apiVersion: v1
kind: ResourceQuota
metadata:
  name: whatsdx-resource-quota
  namespace: whatsdx-ai
spec:
  hard:
    requests.cpu: "8"
    requests.memory: 16Gi
    limits.cpu: "16"
    limits.memory: 32Gi
    persistentvolumeclaims: "20"
    services: "15"
EOF
    
    kubectl apply -f aws-namespace.yaml
    
    # Deploy with AWS-specific ingress
    cat > aws-ingress.yaml << EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: whatsdx-ingress
  namespace: whatsdx-ai
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/ssl-redirect: '443'
    alb.ingress.kubernetes.io/certificate-arn: ${AWS_CERTIFICATE_ARN}
    alb.ingress.kubernetes.io/load-balancer-name: whatsdx-alb
    alb.ingress.kubernetes.io/healthcheck-path: /api/health
    alb.ingress.kubernetes.io/success-codes: '200'
    alb.ingress.kubernetes.io/healthy-threshold-count: '2'
    alb.ingress.kubernetes.io/unhealthy-threshold-count: '3'
spec:
  rules:
  - host: api.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: whatsdx-bot-service
            port:
              number: 3000
  - host: dashboard.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: whatsdx-web-service
            port:
              number: 3000
EOF
    
    kubectl apply -f aws-ingress.yaml
    
    print_success "AWS configurations deployed"
}

# Execute deployment based on strategy
execute_deployment() {
    print_status "Executing $DEPLOYMENT_STRATEGY deployment..."
    
    case $DEPLOYMENT_STRATEGY in
        "blue-green")
            execute_blue_green_aws
            ;;
        "rolling")
            execute_rolling_aws
            ;;
        "canary")
            execute_canary_aws
            ;;
        *)
            print_error "Unknown deployment strategy: $DEPLOYMENT_STRATEGY"
            exit 1
            ;;
    esac
}

# Blue-Green deployment for AWS
execute_blue_green_aws() {
    print_status "Executing Blue-Green deployment on AWS..."
    
    # Determine current and new environments
    if kubectl get namespace whatsdx-blue &>/dev/null; then
        CURRENT_ENV="blue"
        NEW_ENV="green"
    else
        CURRENT_ENV="green"
        NEW_ENV="blue"
    fi
    
    print_status "Current: $CURRENT_ENV, Deploying: $NEW_ENV"
    
    # Create new environment namespace
    sed "s/whatsdx-ai/whatsdx-$NEW_ENV/g" aws-namespace.yaml | kubectl apply -f -
    
    # Deploy to new environment
    for file in deployment/kubernetes/*.yaml; do
        sed "s/whatsdx-ai/whatsdx-$NEW_ENV/g" $file | kubectl apply -f -
    done
    
    # Wait for new environment to be ready
    kubectl wait --for=condition=ready pod -l app=whatsdx-bot -n whatsdx-$NEW_ENV --timeout=600s
    kubectl wait --for=condition=ready pod -l app=whatsdx-web -n whatsdx-$NEW_ENV --timeout=600s
    
    # Health check new environment
    NEW_SERVICE_IP=$(kubectl get service whatsdx-bot-service -n whatsdx-$NEW_ENV -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
    
    if curl -f http://$NEW_SERVICE_IP:3000/api/health; then
        print_success "New environment health check passed"
        
        # Switch traffic by updating ingress
        sed "s/whatsdx-ai/whatsdx-$NEW_ENV/g" aws-ingress.yaml | kubectl apply -f -
        
        # Wait for traffic switch
        sleep 30
        
        # Final health check
        if curl -f https://api.yourdomain.com/api/health; then
            print_success "Traffic switched successfully"
            
            # Clean up old environment
            kubectl delete namespace whatsdx-$CURRENT_ENV || true
            
            print_success "Blue-Green deployment completed"
        else
            print_error "Final health check failed, rolling back..."
            sed "s/whatsdx-ai/whatsdx-$CURRENT_ENV/g" aws-ingress.yaml | kubectl apply -f -
            kubectl delete namespace whatsdx-$NEW_ENV
            exit 1
        fi
    else
        print_error "New environment health check failed"
        kubectl delete namespace whatsdx-$NEW_ENV
        exit 1
    fi
}

# Rolling deployment for AWS
execute_rolling_aws() {
    print_status "Executing Rolling deployment on AWS..."
    
    # Deploy configurations
    kubectl apply -f deployment/kubernetes/
    
    # Rolling update with health checks
    kubectl set image deployment/whatsdx-bot whatsdx-bot=ghcr.io/whatsdx/ai-bot:$IMAGE_TAG -n whatsdx-ai
    kubectl set image deployment/whatsdx-web whatsdx-web=ghcr.io/whatsdx/web-dashboard:$IMAGE_TAG -n whatsdx-ai
    
    # Wait for rollout
    kubectl rollout status deployment/whatsdx-bot -n whatsdx-ai --timeout=600s
    kubectl rollout status deployment/whatsdx-web -n whatsdx-ai --timeout=600s
    
    print_success "Rolling deployment completed"
}

# Canary deployment for AWS
execute_canary_aws() {
    print_status "Executing Canary deployment on AWS..."
    
    # Deploy canary environment (10% traffic)
    kubectl apply -f deployment/kubernetes/
    
    # Create canary service with weight-based routing
    cat > canary-service.yaml << EOF
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: whatsdx-bot-rollout
  namespace: whatsdx-ai
spec:
  replicas: 5
  strategy:
    canary:
      steps:
      - setWeight: 10
      - pause: {duration: 60s}
      - setWeight: 50
      - pause: {duration: 60s}
      - setWeight: 100
      canaryService: whatsdx-bot-canary
      stableService: whatsdx-bot-stable
      trafficRouting:
        alb:
          ingress: whatsdx-ingress
          servicePort: 3000
EOF
    
    kubectl apply -f canary-service.yaml
    
    print_success "Canary deployment initiated"
}

# Setup monitoring and alerting
setup_aws_monitoring() {
    print_status "Setting up AWS monitoring..."
    
    # Install Prometheus with AWS integration
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm repo update
    
    helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
        --namespace monitoring \
        --create-namespace \
        --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
        --set grafana.enabled=true \
        --set grafana.adminPassword=admin123
    
    # Setup CloudWatch integration
    cat > cloudwatch-config.yaml << EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: cwagentconfig
  namespace: amazon-cloudwatch
data:
  cwagentconfig.json: |
    {
      "logs": {
        "metrics_collected": {
          "kubernetes": {
            "cluster_name": "$CLUSTER_NAME",
            "metrics_collection_interval": 60
          }
        }
      },
      "metrics": {
        "namespace": "WhatsDeX/EKS",
        "metrics_collected": {
          "cpu": {"measurement": ["cpu_usage_idle", "cpu_usage_iowait"]},
          "disk": {"measurement": ["used_percent"], "resources": ["*"]},
          "mem": {"measurement": ["mem_used_percent"]}
        }
      }
    }
EOF
    
    kubectl create namespace amazon-cloudwatch || true
    kubectl apply -f cloudwatch-config.yaml
    
    # Install CloudWatch agent
    kubectl apply -f https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/cloudwatch-namespace.yaml
    kubectl apply -f https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/fluentd/fluentd.yaml
    
    print_success "AWS monitoring setup completed"
}

# Main execution
main() {
    print_status "Starting AWS EKS deployment..."
    print_status "Strategy: $DEPLOYMENT_STRATEGY"
    print_status "Image Tag: $IMAGE_TAG"
    print_status "Cluster: $CLUSTER_NAME"
    print_status "Region: $REGION"
    
    check_aws_config
    setup_eks_cluster
    install_aws_controllers
    setup_aws_storage
    deploy_aws_configs
    execute_deployment
    setup_aws_monitoring
    
    print_success "AWS deployment completed successfully! 🚀"
    
    # Display access information
    echo ""
    print_status "Access Information:"
    echo "  - API: https://api.yourdomain.com"
    echo "  - Dashboard: https://dashboard.yourdomain.com"
    echo "  - Grafana: kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80"
    echo "  - Prometheus: kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090"
}

# Error handling
trap 'print_error "AWS deployment failed at line $LINENO"' ERR

# Run main function
main "$@"
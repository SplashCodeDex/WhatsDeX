#!/bin/bash

# WhatsDeX AI Bot - Google Cloud Platform (GKE) Deployment Script
# Automated deployment to Google Kubernetes Engine

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
PROJECT_ID=${4:-$GOOGLE_CLOUD_PROJECT}
ZONE=${5:-"us-central1-a"}
REGION=${6:-"us-central1"}

print_status() {
    echo -e "${BLUE}[GCP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[GCP SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[GCP ERROR]${NC} $1"
}

# Check GCP configuration
check_gcp_config() {
    print_status "Checking Google Cloud configuration..."
    
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -1 &>/dev/null; then
        print_error "GCP authentication not configured"
        exit 1
    fi
    
    if [ -z "$PROJECT_ID" ]; then
        PROJECT_ID=$(gcloud config get-value project)
        if [ -z "$PROJECT_ID" ]; then
            print_error "GCP project ID not set"
            exit 1
        fi
    fi
    
    gcloud config set project $PROJECT_ID
    print_success "GCP configuration verified for project: $PROJECT_ID"
}

# Enable required GCP APIs
enable_gcp_apis() {
    print_status "Enabling required GCP APIs..."
    
    REQUIRED_APIS=(
        "container.googleapis.com"
        "compute.googleapis.com"
        "cloudsql.googleapis.com"
        "redis.googleapis.com"
        "monitoring.googleapis.com"
        "logging.googleapis.com"
        "cloudresourcemanager.googleapis.com"
        "iam.googleapis.com"
        "artifactregistry.googleapis.com"
    )
    
    for api in "${REQUIRED_APIS[@]}"; do
        print_status "Enabling $api..."
        gcloud services enable $api --project=$PROJECT_ID
    done
    
    print_success "GCP APIs enabled successfully"
}

# Create or update GKE cluster
setup_gke_cluster() {
    print_status "Setting up GKE cluster: $CLUSTER_NAME"
    
    # Check if cluster exists
    if gcloud container clusters describe $CLUSTER_NAME --zone=$ZONE --project=$PROJECT_ID &>/dev/null; then
        print_status "GKE cluster $CLUSTER_NAME already exists"
    else
        print_status "Creating GKE cluster $CLUSTER_NAME..."
        
        # Create cluster with optimal configuration
        gcloud container clusters create $CLUSTER_NAME \
            --zone=$ZONE \
            --project=$PROJECT_ID \
            --machine-type=e2-standard-4 \
            --num-nodes=3 \
            --enable-autoscaling \
            --min-nodes=2 \
            --max-nodes=10 \
            --enable-autorepair \
            --enable-autoupgrade \
            --network=default \
            --subnetwork=default \
            --enable-ip-alias \
            --enable-network-policy \
            --addons=HorizontalPodAutoscaling,HttpLoadBalancing,GcePersistentDiskCsiDriver \
            --enable-shielded-nodes \
            --enable-image-streaming \
            --logging=SYSTEM,WORKLOAD \
            --monitoring=SYSTEM \
            --maintenance-window-start=2023-01-01T02:00:00Z \
            --maintenance-window-end=2023-01-01T06:00:00Z \
            --maintenance-window-recurrence="FREQ=WEEKLY;BYDAY=SA" \
            --workload-pool=$PROJECT_ID.svc.id.goog
        
        print_success "GKE cluster created successfully"
    fi
    
    # Get cluster credentials
    gcloud container clusters get-credentials $CLUSTER_NAME --zone=$ZONE --project=$PROJECT_ID
    
    # Create cluster role binding for current user
    kubectl create clusterrolebinding cluster-admin-binding \
        --clusterrole=cluster-admin \
        --user=$(gcloud config get-value core/account) || true
}

# Setup GCP-specific services
setup_gcp_services() {
    print_status "Setting up GCP-specific services..."
    
    # Create Cloud SQL instance for production database
    print_status "Setting up Cloud SQL PostgreSQL instance..."
    
    CLOUDSQL_INSTANCE="whatsdx-postgres-$(date +%s)"
    
    if ! gcloud sql instances describe whatsdx-postgres --project=$PROJECT_ID &>/dev/null; then
        gcloud sql instances create whatsdx-postgres \
            --database-version=POSTGRES_15 \
            --tier=db-g1-small \
            --region=$REGION \
            --storage-type=SSD \
            --storage-size=20GB \
            --storage-auto-increase \
            --backup-start-time=02:00 \
            --maintenance-window-day=SAT \
            --maintenance-window-hour=3 \
            --maintenance-release-channel=production \
            --deletion-protection \
            --project=$PROJECT_ID
        
        # Create database
        gcloud sql databases create whatsdx_production \
            --instance=whatsdx-postgres \
            --project=$PROJECT_ID
        
        # Create user
        gcloud sql users create whatsdx_user \
            --instance=whatsdx-postgres \
            --password=$(openssl rand -base64 32) \
            --project=$PROJECT_ID
    fi
    
    # Create Memory Store Redis instance
    print_status "Setting up Memory Store Redis instance..."
    
    if ! gcloud redis instances describe whatsdx-redis --region=$REGION --project=$PROJECT_ID &>/dev/null; then
        gcloud redis instances create whatsdx-redis \
            --size=1 \
            --region=$REGION \
            --redis-version=redis_7_0 \
            --tier=basic \
            --project=$PROJECT_ID
    fi
    
    # Create Google Cloud Storage buckets
    print_status "Setting up Cloud Storage buckets..."
    
    BUCKET_NAMES=("whatsdx-backups-$PROJECT_ID" "whatsdx-media-$PROJECT_ID" "whatsdx-logs-$PROJECT_ID")
    
    for bucket in "${BUCKET_NAMES[@]}"; do
        if ! gsutil ls gs://$bucket &>/dev/null; then
            gsutil mb -p $PROJECT_ID -c STANDARD -l $REGION gs://$bucket
            gsutil lifecycle set deployment/gcp/bucket-lifecycle.json gs://$bucket
        fi
    done
    
    print_success "GCP services setup completed"
}

# Setup Google Cloud monitoring and logging
setup_gcp_monitoring() {
    print_status "Setting up Google Cloud monitoring and logging..."
    
    # Install Google Cloud Managed Service for Prometheus
    print_status "Installing Google Cloud Managed Service for Prometheus..."
    
    cat > gcp-prometheus-config.yaml << EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: gmp-system
data:
  config.yaml: |
    global:
      scrape_interval: 15s
    scrape_configs:
    - job_name: 'whatsdx-bot'
      kubernetes_sd_configs:
      - role: pod
        namespaces:
          names:
          - whatsdx-ai
      relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        regex: whatsdx-bot
        action: keep
      - source_labels: [__meta_kubernetes_pod_ip]
        target_label: __address__
        replacement: '\${1}:3000'
EOF
    
    # Enable Google Cloud Monitoring
    kubectl create namespace gmp-system || true
    kubectl apply -f https://raw.githubusercontent.com/GoogleCloudPlatform/prometheus-engine/main/manifests/setup.yaml
    kubectl apply -f gcp-prometheus-config.yaml
    
    # Setup Cloud Logging
    print_status "Configuring Cloud Logging..."
    
    cat > gcp-logging-config.yaml << EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluent-bit-config
  namespace: kube-system
data:
  fluent-bit.conf: |
    [SERVICE]
        Flush         1
        Log_Level     info
        Daemon        off
        Parsers_File  parsers.conf
    
    [INPUT]
        Name              tail
        Path              /var/log/containers/whatsdx-*.log
        Parser            docker
        Tag               kube.*
        Refresh_Interval  5
        Mem_Buf_Limit     5MB
        Skip_Long_Lines   On
    
    [OUTPUT]
        Name  stackdriver
        Match kube.*
        google_service_credentials /var/secrets/google/key.json
        resource k8s_container
EOF
    
    kubectl apply -f gcp-logging-config.yaml
    
    print_success "GCP monitoring and logging setup completed"
}

# Setup Workload Identity for secure service account access
setup_workload_identity() {
    print_status "Setting up Workload Identity..."
    
    # Create Google Service Account
    GSA_NAME="whatsdx-gsa"
    
    if ! gcloud iam service-accounts describe $GSA_NAME@$PROJECT_ID.iam.gserviceaccount.com --project=$PROJECT_ID &>/dev/null; then
        gcloud iam service-accounts create $GSA_NAME \
            --display-name="WhatsDeX Service Account" \
            --project=$PROJECT_ID
    fi
    
    # Grant necessary permissions
    ROLES=(
        "roles/cloudsql.client"
        "roles/redis.editor"
        "roles/storage.objectAdmin"
        "roles/monitoring.metricWriter"
        "roles/logging.logWriter"
    )
    
    for role in "${ROLES[@]}"; do
        gcloud projects add-iam-policy-binding $PROJECT_ID \
            --member="serviceAccount:$GSA_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
            --role="$role"
    done
    
    # Create Kubernetes Service Account
    kubectl create serviceaccount whatsdx-ksa -n whatsdx-ai || true
    
    # Bind GSA to KSA
    gcloud iam service-accounts add-iam-policy-binding \
        $GSA_NAME@$PROJECT_ID.iam.gserviceaccount.com \
        --role roles/iam.workloadIdentityUser \
        --member "serviceAccount:$PROJECT_ID.svc.id.goog[whatsdx-ai/whatsdx-ksa]" \
        --project=$PROJECT_ID
    
    # Annotate KSA
    kubectl annotate serviceaccount whatsdx-ksa \
        -n whatsdx-ai \
        iam.gke.io/gcp-service-account=$GSA_NAME@$PROJECT_ID.iam.gserviceaccount.com
    
    print_success "Workload Identity setup completed"
}

# Deploy GCP-specific configurations
deploy_gcp_configs() {
    print_status "Deploying GCP-specific configurations..."
    
    # Update image tags and registry
    sed -i "s|:latest|:$IMAGE_TAG|g" deployment/kubernetes/*.yaml
    sed -i "s|ghcr.io|gcr.io/$PROJECT_ID|g" deployment/kubernetes/*.yaml
    sed -i "s|storageClassName: fast-ssd|storageClassName: ssd|g" deployment/kubernetes/*.yaml
    
    # Create GCP-specific namespace
    cat > gcp-namespace.yaml << EOF
apiVersion: v1
kind: Namespace
metadata:
  name: whatsdx-ai
  labels:
    name: whatsdx-ai
    app: whatsdx-bot
    version: "$IMAGE_TAG"
    platform: gcp
    istio-injection: enabled
  annotations:
    cloud.google.com/neg: '{"ingress": true}'
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
    count/ingresses.networking.k8s.io: "5"
EOF
    
    kubectl apply -f gcp-namespace.yaml
    
    # Create GCP-specific ingress with Google Cloud Load Balancer
    cat > gcp-ingress.yaml << EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: whatsdx-ingress
  namespace: whatsdx-ai
  annotations:
    kubernetes.io/ingress.class: "gce"
    kubernetes.io/ingress.global-static-ip-name: "whatsdx-ip"
    networking.gke.io/managed-certificates: "whatsdx-ssl-cert"
    cloud.google.com/neg: '{"ingress": true}'
    cloud.google.com/backend-config: '{"default": "whatsdx-backend-config"}'
    kubernetes.io/ingress.allow-http: "false"
spec:
  rules:
  - host: api.yourdomain.com
    http:
      paths:
      - path: /*
        pathType: ImplementationSpecific
        backend:
          service:
            name: whatsdx-bot-service
            port:
              number: 3000
  - host: dashboard.yourdomain.com
    http:
      paths:
      - path: /*
        pathType: ImplementationSpecific
        backend:
          service:
            name: whatsdx-web-service
            port:
              number: 3000
---
apiVersion: networking.gke.io/v1
kind: ManagedCertificate
metadata:
  name: whatsdx-ssl-cert
  namespace: whatsdx-ai
spec:
  domains:
    - api.yourdomain.com
    - dashboard.yourdomain.com
---
apiVersion: cloud.google.com/v1
kind: BackendConfig
metadata:
  name: whatsdx-backend-config
  namespace: whatsdx-ai
spec:
  healthCheck:
    checkIntervalSec: 30
    port: 3000
    type: HTTP
    requestPath: /api/health
  sessionAffinity:
    affinityType: "CLIENT_IP"
  timeoutSec: 30
  connectionDraining:
    drainingTimeoutSec: 60
EOF
    
    # Reserve static IP address
    gcloud compute addresses create whatsdx-ip --global --project=$PROJECT_ID || true
    
    kubectl apply -f gcp-ingress.yaml
    
    # Deploy Cloud SQL Proxy
    cat > cloudsql-proxy.yaml << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cloudsql-proxy
  namespace: whatsdx-ai
spec:
  replicas: 1
  selector:
    matchLabels:
      app: cloudsql-proxy
  template:
    metadata:
      labels:
        app: cloudsql-proxy
    spec:
      serviceAccountName: whatsdx-ksa
      containers:
      - name: cloud-sql-proxy
        image: gcr.io/cloudsql-docker/gce-proxy:1.33.2
        command:
        - "/cloud_sql_proxy"
        - "-instances=$PROJECT_ID:$REGION:whatsdx-postgres=tcp:5432"
        - "-credential_file=/var/secrets/google/key.json"
        securityContext:
          runAsNonRoot: true
        volumeMounts:
        - name: cloudsql-instance-credentials
          mountPath: /var/secrets/google
          readOnly: true
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
      volumes:
      - name: cloudsql-instance-credentials
        secret:
          secretName: cloudsql-instance-credentials
---
apiVersion: v1
kind: Service
metadata:
  name: cloudsql-proxy-service
  namespace: whatsdx-ai
spec:
  selector:
    app: cloudsql-proxy
  ports:
  - port: 5432
    targetPort: 5432
  type: ClusterIP
EOF
    
    kubectl apply -f cloudsql-proxy.yaml
    
    print_success "GCP configurations deployed"
}

# Execute deployment based on strategy
execute_deployment() {
    print_status "Executing $DEPLOYMENT_STRATEGY deployment on GCP..."
    
    case $DEPLOYMENT_STRATEGY in
        "blue-green")
            execute_blue_green_gcp
            ;;
        "rolling")
            execute_rolling_gcp
            ;;
        "canary")
            execute_canary_gcp
            ;;
        *)
            print_error "Unknown deployment strategy: $DEPLOYMENT_STRATEGY"
            exit 1
            ;;
    esac
}

# Blue-Green deployment for GCP
execute_blue_green_gcp() {
    print_status "Executing Blue-Green deployment on GCP..."
    
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
    sed "s/whatsdx-ai/whatsdx-$NEW_ENV/g" gcp-namespace.yaml | kubectl apply -f -
    
    # Deploy to new environment
    for file in deployment/kubernetes/*.yaml; do
        sed "s/whatsdx-ai/whatsdx-$NEW_ENV/g" $file | kubectl apply -f -
    done
    
    # Wait for new environment to be ready
    kubectl wait --for=condition=ready pod -l app=whatsdx-bot -n whatsdx-$NEW_ENV --timeout=600s
    kubectl wait --for=condition=ready pod -l app=whatsdx-web -n whatsdx-$NEW_ENV --timeout=600s
    
    # Health check new environment using Google Cloud Load Balancer
    NEW_SERVICE_IP=$(kubectl get ingress whatsdx-ingress -n whatsdx-$NEW_ENV -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    
    if curl -f http://$NEW_SERVICE_IP/api/health; then
        print_success "New environment health check passed"
        
        # Switch traffic by updating ingress backend service
        kubectl patch ingress whatsdx-ingress -n whatsdx-ai --type='merge' -p='{"spec":{"rules":[{"host":"api.yourdomain.com","http":{"paths":[{"path":"/*","pathType":"ImplementationSpecific","backend":{"service":{"name":"whatsdx-bot-service","port":{"number":3000}}}}]}}]}}'
        
        # Wait for traffic switch
        sleep 60
        
        # Final health check
        if curl -f https://api.yourdomain.com/api/health; then
            print_success "Traffic switched successfully"
            
            # Clean up old environment
            kubectl delete namespace whatsdx-$CURRENT_ENV || true
            
            print_success "Blue-Green deployment completed"
        else
            print_error "Final health check failed, rolling back..."
            # Rollback logic here
            exit 1
        fi
    else
        print_error "New environment health check failed"
        kubectl delete namespace whatsdx-$NEW_ENV
        exit 1
    fi
}

# Rolling deployment for GCP
execute_rolling_gcp() {
    print_status "Executing Rolling deployment on GCP..."
    
    # Deploy configurations
    kubectl apply -f deployment/kubernetes/
    kubectl apply -f gcp-ingress.yaml
    kubectl apply -f cloudsql-proxy.yaml
    
    # Rolling update with health checks
    kubectl set image deployment/whatsdx-bot whatsdx-bot=gcr.io/$PROJECT_ID/whatsdx-bot:$IMAGE_TAG -n whatsdx-ai
    kubectl set image deployment/whatsdx-web whatsdx-web=gcr.io/$PROJECT_ID/whatsdx-web:$IMAGE_TAG -n whatsdx-ai
    
    # Wait for rollout
    kubectl rollout status deployment/whatsdx-bot -n whatsdx-ai --timeout=600s
    kubectl rollout status deployment/whatsdx-web -n whatsdx-ai --timeout=600s
    
    print_success "Rolling deployment completed"
}

# Canary deployment for GCP using Istio
execute_canary_gcp() {
    print_status "Executing Canary deployment on GCP with Istio..."
    
    # Install Istio if not present
    if ! kubectl get namespace istio-system &>/dev/null; then
        print_status "Installing Istio..."
        curl -L https://istio.io/downloadIstio | sh -
        cd istio-*/
        export PATH=$PWD/bin:$PATH
        istioctl install --set values.defaultRevision=default -y
        kubectl label namespace whatsdx-ai istio-injection=enabled
    fi
    
    # Deploy canary with Istio VirtualService
    cat > istio-canary.yaml << EOF
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: whatsdx-bot-vs
  namespace: whatsdx-ai
spec:
  hosts:
  - api.yourdomain.com
  http:
  - match:
    - headers:
        canary:
          exact: "true"
    route:
    - destination:
        host: whatsdx-bot-canary
        port:
          number: 3000
  - route:
    - destination:
        host: whatsdx-bot-stable
        port:
          number: 3000
      weight: 90
    - destination:
        host: whatsdx-bot-canary
        port:
          number: 3000
      weight: 10
EOF
    
    kubectl apply -f istio-canary.yaml
    
    print_success "Canary deployment initiated with Istio"
}

# Main execution
main() {
    print_status "Starting GCP GKE deployment..."
    print_status "Strategy: $DEPLOYMENT_STRATEGY"
    print_status "Image Tag: $IMAGE_TAG"
    print_status "Cluster: $CLUSTER_NAME"
    print_status "Project: $PROJECT_ID"
    print_status "Zone: $ZONE"
    
    check_gcp_config
    enable_gcp_apis
    setup_gke_cluster
    setup_gcp_services
    setup_workload_identity
    setup_gcp_monitoring
    deploy_gcp_configs
    execute_deployment
    
    print_success "GCP deployment completed successfully! 🚀"
    
    # Display access information
    echo ""
    print_status "Access Information:"
    EXTERNAL_IP=$(gcloud compute addresses describe whatsdx-ip --global --format="value(address)" --project=$PROJECT_ID)
    echo "  - API: https://api.yourdomain.com (IP: $EXTERNAL_IP)"
    echo "  - Dashboard: https://dashboard.yourdomain.com"
    echo "  - Cloud Console: https://console.cloud.google.com/kubernetes/workload/overview?project=$PROJECT_ID"
    echo "  - Monitoring: https://console.cloud.google.com/monitoring?project=$PROJECT_ID"
    echo "  - Logs: https://console.cloud.google.com/logs/query?project=$PROJECT_ID"
}

# Error handling
trap 'print_error "GCP deployment failed at line $LINENO"' ERR

# Run main function
main "$@"
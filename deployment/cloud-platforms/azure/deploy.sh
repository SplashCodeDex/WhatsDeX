#!/bin/bash

# WhatsDeX AI Bot - Microsoft Azure (AKS) Deployment Script
# Automated deployment to Azure Kubernetes Service

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
RESOURCE_GROUP=${4:-"whatsdx-rg"}
LOCATION=${5:-"eastus"}
SUBSCRIPTION_ID=${6:-$(az account show --query id -o tsv)}

print_status() {
    echo -e "${BLUE}[AZURE]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[AZURE SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[AZURE ERROR]${NC} $1"
}

# Check Azure CLI configuration
check_azure_config() {
    print_status "Checking Azure CLI configuration..."
    
    if ! az account show &>/dev/null; then
        print_error "Azure CLI not authenticated"
        exit 1
    fi
    
    # Set subscription if provided
    if [ ! -z "$SUBSCRIPTION_ID" ]; then
        az account set --subscription $SUBSCRIPTION_ID
    fi
    
    CURRENT_SUBSCRIPTION=$(az account show --query name -o tsv)
    print_success "Azure authentication verified for subscription: $CURRENT_SUBSCRIPTION"
}

# Create resource group and setup Azure resources
setup_azure_resources() {
    print_status "Setting up Azure resources..."
    
    # Create resource group
    if ! az group show --name $RESOURCE_GROUP &>/dev/null; then
        print_status "Creating resource group: $RESOURCE_GROUP"
        az group create --name $RESOURCE_GROUP --location $LOCATION
    else
        print_status "Resource group $RESOURCE_GROUP already exists"
    fi
    
    # Create Azure Container Registry
    ACR_NAME="whatsdxacr$(echo $RESOURCE_GROUP | tr -d '-' | tr '[:upper:]' '[:lower:]')"
    
    if ! az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP &>/dev/null; then
        print_status "Creating Azure Container Registry: $ACR_NAME"
        az acr create --resource-group $RESOURCE_GROUP \
                     --name $ACR_NAME \
                     --sku Standard \
                     --admin-enabled true
    fi
    
    # Create Azure Database for PostgreSQL
    POSTGRES_SERVER="whatsdx-postgres-$(date +%s | tail -c 6)"
    
    if ! az postgres flexible-server show --name $POSTGRES_SERVER --resource-group $RESOURCE_GROUP &>/dev/null; then
        print_status "Creating Azure Database for PostgreSQL: $POSTGRES_SERVER"
        
        # Generate password
        POSTGRES_PASSWORD=$(openssl rand -base64 32)
        
        az postgres flexible-server create \
            --resource-group $RESOURCE_GROUP \
            --name $POSTGRES_SERVER \
            --location $LOCATION \
            --admin-user whatsdx_admin \
            --admin-password $POSTGRES_PASSWORD \
            --sku-name Standard_B2s \
            --tier Burstable \
            --storage-size 32 \
            --version 15 \
            --high-availability Disabled \
            --zone 1
        
        # Create database
        az postgres flexible-server db create \
            --resource-group $RESOURCE_GROUP \
            --server-name $POSTGRES_SERVER \
            --database-name whatsdx_production
        
        # Configure firewall to allow Azure services
        az postgres flexible-server firewall-rule create \
            --resource-group $RESOURCE_GROUP \
            --name $POSTGRES_SERVER \
            --rule-name AllowAzureServices \
            --start-ip-address 0.0.0.0 \
            --end-ip-address 0.0.0.0
    fi
    
    # Create Azure Cache for Redis
    REDIS_NAME="whatsdx-redis-$(date +%s | tail -c 6)"
    
    if ! az redis show --name $REDIS_NAME --resource-group $RESOURCE_GROUP &>/dev/null; then
        print_status "Creating Azure Cache for Redis: $REDIS_NAME"
        az redis create --location $LOCATION \
                       --name $REDIS_NAME \
                       --resource-group $RESOURCE_GROUP \
                       --sku Basic \
                       --vm-size c0 \
                       --enable-non-ssl-port
    fi
    
    # Create Storage Account for backups and media
    STORAGE_ACCOUNT="whatsdxstorage$(date +%s | tail -c 6)"
    
    if ! az storage account show --name $STORAGE_ACCOUNT --resource-group $RESOURCE_GROUP &>/dev/null; then
        print_status "Creating Storage Account: $STORAGE_ACCOUNT"
        az storage account create --name $STORAGE_ACCOUNT \
                                 --resource-group $RESOURCE_GROUP \
                                 --location $LOCATION \
                                 --sku Standard_LRS \
                                 --kind StorageV2
        
        # Create containers
        STORAGE_KEY=$(az storage account keys list --resource-group $RESOURCE_GROUP --account-name $STORAGE_ACCOUNT --query '[0].value' -o tsv)
        
        az storage container create --name backups --account-name $STORAGE_ACCOUNT --account-key $STORAGE_KEY
        az storage container create --name media --account-name $STORAGE_ACCOUNT --account-key $STORAGE_KEY
        az storage container create --name logs --account-name $STORAGE_ACCOUNT --account-key $STORAGE_KEY
    fi
    
    print_success "Azure resources setup completed"
}

# Create or update AKS cluster
setup_aks_cluster() {
    print_status "Setting up AKS cluster: $CLUSTER_NAME"
    
    # Check if cluster exists
    if az aks show --name $CLUSTER_NAME --resource-group $RESOURCE_GROUP &>/dev/null; then
        print_status "AKS cluster $CLUSTER_NAME already exists"
    else
        print_status "Creating AKS cluster $CLUSTER_NAME..."
        
        # Create service principal for AKS (or use system-assigned managed identity)
        az aks create --resource-group $RESOURCE_GROUP \
                     --name $CLUSTER_NAME \
                     --location $LOCATION \
                     --node-count 3 \
                     --min-count 2 \
                     --max-count 10 \
                     --enable-cluster-autoscaler \
                     --node-vm-size Standard_D4s_v3 \
                     --network-plugin azure \
                     --network-policy azure \
                     --service-cidr 10.240.0.0/16 \
                     --dns-service-ip 10.240.0.10 \
                     --enable-managed-identity \
                     --assign-identity \
                     --attach-acr $ACR_NAME \
                     --enable-addons monitoring \
                     --enable-msi-auth-for-monitoring \
                     --kubernetes-version $(az aks get-versions --location $LOCATION --query 'orchestrators[-1].orchestratorVersion' -o tsv) \
                     --enable-ahub \
                     --tier standard
        
        print_success "AKS cluster created successfully"
    fi
    
    # Get cluster credentials
    az aks get-credentials --resource-group $RESOURCE_GROUP --name $CLUSTER_NAME --overwrite-existing
    
    # Install necessary add-ons
    print_status "Installing AKS add-ons..."
    
    # Enable Azure Application Gateway Ingress Controller
    az aks enable-addons --resource-group $RESOURCE_GROUP \
                        --name $CLUSTER_NAME \
                        --addons ingress-appgw \
                        --appgw-name whatsdx-appgw \
                        --appgw-subnet-prefix "10.225.0.0/16" || true
    
    # Enable Azure Policy
    az aks enable-addons --resource-group $RESOURCE_GROUP \
                        --name $CLUSTER_NAME \
                        --addons azure-policy || true
    
    # Enable secret store CSI driver
    az aks enable-addons --resource-group $RESOURCE_GROUP \
                        --name $CLUSTER_NAME \
                        --addons azure-keyvault-secrets-provider || true
}

# Setup Azure Key Vault for secrets management
setup_azure_keyvault() {
    print_status "Setting up Azure Key Vault..."
    
    KEYVAULT_NAME="whatsdx-kv-$(date +%s | tail -c 6)"
    
    if ! az keyvault show --name $KEYVAULT_NAME --resource-group $RESOURCE_GROUP &>/dev/null; then
        az keyvault create --name $KEYVAULT_NAME \
                          --resource-group $RESOURCE_GROUP \
                          --location $LOCATION \
                          --sku standard \
                          --enable-rbac-authorization false
        
        # Store secrets
        az keyvault secret set --vault-name $KEYVAULT_NAME --name "postgres-password" --value "$POSTGRES_PASSWORD"
        az keyvault secret set --vault-name $KEYVAULT_NAME --name "redis-key" --value "$(az redis list-keys --name $REDIS_NAME --resource-group $RESOURCE_GROUP --query primaryKey -o tsv)"
        az keyvault secret set --vault-name $KEYVAULT_NAME --name "storage-key" --value "$STORAGE_KEY"
        
        # Grant AKS cluster access to Key Vault
        AKS_IDENTITY=$(az aks show --name $CLUSTER_NAME --resource-group $RESOURCE_GROUP --query identityProfile.kubeletidentity.clientId -o tsv)
        az keyvault set-policy --name $KEYVAULT_NAME \
                              --spn $AKS_IDENTITY \
                              --secret-permissions get list
    fi
    
    print_success "Azure Key Vault setup completed"
}

# Setup Azure monitoring and logging
setup_azure_monitoring() {
    print_status "Setting up Azure monitoring and logging..."
    
    # Create Log Analytics Workspace
    WORKSPACE_NAME="whatsdx-workspace-$(date +%s | tail -c 6)"
    
    if ! az monitor log-analytics workspace show --workspace-name $WORKSPACE_NAME --resource-group $RESOURCE_GROUP &>/dev/null; then
        az monitor log-analytics workspace create --workspace-name $WORKSPACE_NAME \
                                                 --resource-group $RESOURCE_GROUP \
                                                 --location $LOCATION \
                                                 --sku pergb2018
    fi
    
    # Enable Container Insights
    WORKSPACE_ID=$(az monitor log-analytics workspace show --workspace-name $WORKSPACE_NAME --resource-group $RESOURCE_GROUP --query id -o tsv)
    
    az aks enable-addons --resource-group $RESOURCE_GROUP \
                        --name $CLUSTER_NAME \
                        --addons monitoring \
                        --workspace-resource-id $WORKSPACE_ID || true
    
    # Setup Application Insights
    APPINSIGHTS_NAME="whatsdx-insights-$(date +%s | tail -c 6)"
    
    if ! az monitor app-insights component show --app $APPINSIGHTS_NAME --resource-group $RESOURCE_GROUP &>/dev/null; then
        az monitor app-insights component create --app $APPINSIGHTS_NAME \
                                                --location $LOCATION \
                                                --resource-group $RESOURCE_GROUP \
                                                --workspace $WORKSPACE_ID
    fi
    
    print_success "Azure monitoring setup completed"
}

# Deploy Azure-specific configurations
deploy_azure_configs() {
    print_status "Deploying Azure-specific configurations..."
    
    # Update image tags to use ACR
    sed -i "s|:latest|:$IMAGE_TAG|g" deployment/kubernetes/*.yaml
    sed -i "s|ghcr.io|$ACR_NAME.azurecr.io|g" deployment/kubernetes/*.yaml
    sed -i "s|storageClassName: fast-ssd|storageClassName: managed-premium|g" deployment/kubernetes/*.yaml
    
    # Create Azure-specific namespace
    cat > azure-namespace.yaml << EOF
apiVersion: v1
kind: Namespace
metadata:
  name: whatsdx-ai
  labels:
    name: whatsdx-ai
    app: whatsdx-bot
    version: "$IMAGE_TAG"
    platform: azure
  annotations:
    azure.workload.identity/use: "true"
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
    
    kubectl apply -f azure-namespace.yaml
    
    # Create Azure-specific ingress with Application Gateway
    cat > azure-ingress.yaml << EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: whatsdx-ingress
  namespace: whatsdx-ai
  annotations:
    kubernetes.io/ingress.class: azure/application-gateway
    appgw.ingress.kubernetes.io/ssl-redirect: "true"
    appgw.ingress.kubernetes.io/use-private-ip: "false"
    appgw.ingress.kubernetes.io/backend-path-prefix: "/"
    appgw.ingress.kubernetes.io/health-probe-path: "/api/health"
    appgw.ingress.kubernetes.io/health-probe-status-codes: "200"
    appgw.ingress.kubernetes.io/request-timeout: "30"
    appgw.ingress.kubernetes.io/connection-draining: "true"
    appgw.ingress.kubernetes.io/connection-draining-timeout: "30"
spec:
  tls:
  - hosts:
    - api.yourdomain.com
    - dashboard.yourdomain.com
    secretName: whatsdx-tls-secret
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
    
    kubectl apply -f azure-ingress.yaml
    
    # Create Secret Provider Class for Azure Key Vault
    cat > azure-secrets.yaml << EOF
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: whatsdx-secrets
  namespace: whatsdx-ai
spec:
  provider: azure
  parameters:
    usePodIdentity: "false"
    useVMManagedIdentity: "true"
    userAssignedIdentityID: "$AKS_IDENTITY"
    keyvaultName: "$KEYVAULT_NAME"
    tenantId: "$(az account show --query tenantId -o tsv)"
    objects: |
      array:
        - |
          objectName: postgres-password
          objectType: secret
          objectVersion: ""
        - |
          objectName: redis-key
          objectType: secret
          objectVersion: ""
        - |
          objectName: storage-key
          objectType: secret
          objectVersion: ""
  secretObjects:
  - secretName: whatsdx-secrets
    type: Opaque
    data:
    - objectName: postgres-password
      key: POSTGRES_PASSWORD
    - objectName: redis-key
      key: REDIS_PASSWORD
    - objectName: storage-key
      key: STORAGE_KEY
EOF
    
    kubectl apply -f azure-secrets.yaml
    
    print_success "Azure configurations deployed"
}

# Execute deployment based on strategy
execute_deployment() {
    print_status "Executing $DEPLOYMENT_STRATEGY deployment on Azure..."
    
    case $DEPLOYMENT_STRATEGY in
        "blue-green")
            execute_blue_green_azure
            ;;
        "rolling")
            execute_rolling_azure
            ;;
        "canary")
            execute_canary_azure
            ;;
        *)
            print_error "Unknown deployment strategy: $DEPLOYMENT_STRATEGY"
            exit 1
            ;;
    esac
}

# Blue-Green deployment for Azure
execute_blue_green_azure() {
    print_status "Executing Blue-Green deployment on Azure..."
    
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
    sed "s/whatsdx-ai/whatsdx-$NEW_ENV/g" azure-namespace.yaml | kubectl apply -f -
    
    # Deploy to new environment
    for file in deployment/kubernetes/*.yaml; do
        sed "s/whatsdx-ai/whatsdx-$NEW_ENV/g" $file | kubectl apply -f -
    done
    
    # Deploy secrets to new environment
    sed "s/whatsdx-ai/whatsdx-$NEW_ENV/g" azure-secrets.yaml | kubectl apply -f -
    
    # Wait for new environment to be ready
    kubectl wait --for=condition=ready pod -l app=whatsdx-bot -n whatsdx-$NEW_ENV --timeout=600s
    kubectl wait --for=condition=ready pod -l app=whatsdx-web -n whatsdx-$NEW_ENV --timeout=600s
    
    # Health check new environment using Application Gateway
    NEW_SERVICE_IP=$(kubectl get service whatsdx-bot-service -n whatsdx-$NEW_ENV -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    
    if curl -f http://$NEW_SERVICE_IP:3000/api/health; then
        print_success "New environment health check passed"
        
        # Switch traffic by updating Application Gateway backend pools
        APPGW_NAME=$(az network application-gateway list --resource-group $RESOURCE_GROUP --query '[0].name' -o tsv)
        
        # Update backend pool to point to new environment
        az network application-gateway address-pool update \
            --gateway-name $APPGW_NAME \
            --name defaultaddresspool \
            --resource-group $RESOURCE_GROUP \
            --servers $NEW_SERVICE_IP
        
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

# Rolling deployment for Azure
execute_rolling_azure() {
    print_status "Executing Rolling deployment on Azure..."
    
    # Deploy configurations
    kubectl apply -f deployment/kubernetes/
    kubectl apply -f azure-ingress.yaml
    kubectl apply -f azure-secrets.yaml
    
    # Rolling update with health checks
    kubectl set image deployment/whatsdx-bot whatsdx-bot=$ACR_NAME.azurecr.io/whatsdx-bot:$IMAGE_TAG -n whatsdx-ai
    kubectl set image deployment/whatsdx-web whatsdx-web=$ACR_NAME.azurecr.io/whatsdx-web:$IMAGE_TAG -n whatsdx-ai
    
    # Wait for rollout
    kubectl rollout status deployment/whatsdx-bot -n whatsdx-ai --timeout=600s
    kubectl rollout status deployment/whatsdx-web -n whatsdx-ai --timeout=600s
    
    print_success "Rolling deployment completed"
}

# Canary deployment for Azure using Flagger
execute_canary_azure() {
    print_status "Executing Canary deployment on Azure with Flagger..."
    
    # Install Flagger if not present
    if ! kubectl get namespace flagger-system &>/dev/null; then
        print_status "Installing Flagger..."
        kubectl apply -k github.com/fluxcd/flagger//kustomize/base
        
        # Configure Flagger for Application Gateway
        cat > flagger-config.yaml << EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: flagger-config
  namespace: flagger-system
data:
  config.yaml: |
    appgw:
      resourceGroup: "$RESOURCE_GROUP"
      applicationGateway: "$(az network application-gateway list --resource-group $RESOURCE_GROUP --query '[0].name' -o tsv)"
      subscriptionId: "$SUBSCRIPTION_ID"
EOF
        
        kubectl apply -f flagger-config.yaml
    fi
    
    # Deploy canary with Flagger
    cat > azure-canary.yaml << EOF
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: whatsdx-bot-canary
  namespace: whatsdx-ai
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: whatsdx-bot
  progressDeadlineSeconds: 60
  service:
    port: 3000
    targetPort: 3000
    gateways:
    - whatsdx-gateway
    hosts:
    - api.yourdomain.com
  analysis:
    interval: 30s
    threshold: 5
    maxWeight: 50
    stepWeight: 10
    metrics:
    - name: request-success-rate
      threshold: 99
      interval: 1m
    - name: request-duration
      threshold: 500
      interval: 30s
    webhooks:
    - name: load-test
      url: http://flagger-loadtester.test/
      metadata:
        cmd: "hey -z 1m -q 10 -c 2 http://api.yourdomain.com/api/health"
EOF
    
    kubectl apply -f azure-canary.yaml
    
    print_success "Canary deployment initiated with Flagger"
}

# Main execution
main() {
    print_status "Starting Azure AKS deployment..."
    print_status "Strategy: $DEPLOYMENT_STRATEGY"
    print_status "Image Tag: $IMAGE_TAG"
    print_status "Cluster: $CLUSTER_NAME"
    print_status "Resource Group: $RESOURCE_GROUP"
    print_status "Location: $LOCATION"
    
    check_azure_config
    setup_azure_resources
    setup_aks_cluster
    setup_azure_keyvault
    setup_azure_monitoring
    deploy_azure_configs
    execute_deployment
    
    print_success "Azure deployment completed successfully! 🚀"
    
    # Display access information
    echo ""
    print_status "Access Information:"
    APPGW_IP=$(az network public-ip show --resource-group $RESOURCE_GROUP --name $(az network application-gateway show --name whatsdx-appgw --resource-group $RESOURCE_GROUP --query 'frontendIpConfigurations[0].publicIpAddress.id' -o tsv | xargs basename) --query ipAddress -o tsv)
    echo "  - API: https://api.yourdomain.com (IP: $APPGW_IP)"
    echo "  - Dashboard: https://dashboard.yourdomain.com"
    echo "  - Azure Portal: https://portal.azure.com/#@/resource/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP"
    echo "  - Monitor: https://portal.azure.com/#blade/Microsoft_Azure_Monitoring/AzureMonitoringBrowseBlade"
    echo "  - Container Insights: https://portal.azure.com/#blade/Microsoft_Azure_Monitoring_Containers/AzureMonitorContainersBlade"
}

# Error handling
trap 'print_error "Azure deployment failed at line $LINENO"' ERR

# Run main function
main "$@"
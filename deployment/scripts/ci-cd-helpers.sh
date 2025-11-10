#!/bin/bash

# WhatsDeX AI Bot - CI/CD Helper Scripts
# Collection of utility functions for deployment automation

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Version management
generate_version() {
    local version_type=${1:-"auto"}
    
    case $version_type in
        "tag")
            echo ${GITHUB_REF#refs/tags/}
            ;;
        "branch")
            echo "v$(date +%Y%m%d)-$(git rev-parse --short HEAD)"
            ;;
        "auto")
            if [[ $GITHUB_REF == refs/tags/* ]]; then
                echo ${GITHUB_REF#refs/tags/}
            else
                echo "v$(date +%Y%m%d)-$(git rev-parse --short HEAD)"
            fi
            ;;
        *)
            echo "v1.0.0-$(git rev-parse --short HEAD)"
            ;;
    esac
}

# Docker image management
build_and_push_image() {
    local component=$1
    local version=$2
    local registry=${3:-"ghcr.io"}
    local repository=${4:-$GITHUB_REPOSITORY}
    
    log_info "Building Docker image for $component"
    
    # Build image
    docker build \
        -f deployment/dockerfiles/Dockerfile.$component \
        -t $registry/$repository-$component:$version \
        -t $registry/$repository-$component:latest \
        --build-arg VERSION=$version \
        --build-arg NODE_ENV=production \
        .
    
    # Push image
    log_info "Pushing Docker image for $component"
    docker push $registry/$repository-$component:$version
    docker push $registry/$repository-$component:latest
    
    log_success "Image built and pushed: $registry/$repository-$component:$version"
}

# Health check functions
wait_for_service() {
    local service_url=$1
    local timeout=${2:-300}
    local interval=${3:-10}
    
    log_info "Waiting for service at $service_url to be healthy..."
    
    local counter=0
    while [ $counter -lt $timeout ]; do
        if curl -f "$service_url/api/health" > /dev/null 2>&1; then
            log_success "Service at $service_url is healthy"
            return 0
        fi
        
        sleep $interval
        counter=$((counter + interval))
        echo -n "."
    done
    
    log_error "Service at $service_url failed to become healthy within $timeout seconds"
    return 1
}

# Kubernetes deployment helpers
k8s_wait_for_rollout() {
    local deployment=$1
    local namespace=${2:-"whatsdx-ai"}
    local timeout=${3:-600}
    
    log_info "Waiting for rollout of $deployment in namespace $namespace"
    
    if kubectl rollout status deployment/$deployment -n $namespace --timeout=${timeout}s; then
        log_success "Rollout completed for $deployment"
        return 0
    else
        log_error "Rollout failed for $deployment"
        return 1
    fi
}

k8s_get_external_ip() {
    local service=$1
    local namespace=${2:-"whatsdx-ai"}
    
    kubectl get service $service -n $namespace -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
}

# Database migration helpers
run_migrations() {
    local environment=${1:-"production"}
    
    log_info "Running database migrations for $environment"
    
    case $environment in
        "kubernetes")
            kubectl exec -n whatsdx-ai deployment/whatsdx-bot -- npm run migrate
            ;;
        "docker-compose")
            docker-compose exec whatsdx-bot npm run migrate
            ;;
        *)
            npm run migrate
            ;;
    esac
    
    log_success "Database migrations completed"
}

# Security scanning
scan_image_security() {
    local image=$1
    local format=${2:-"table"}
    
    log_info "Scanning image $image for security vulnerabilities"
    
    # Run Trivy scan
    if command -v trivy &> /dev/null; then
        trivy image --format $format $image
    else
        log_warning "Trivy not installed, skipping security scan"
    fi
}

# Performance testing
run_load_test() {
    local target_url=$1
    local duration=${2:-"60s"}
    local concurrency=${3:-10}
    
    log_info "Running load test against $target_url"
    
    if command -v hey &> /dev/null; then
        hey -z $duration -c $concurrency $target_url/api/health
    elif command -v ab &> /dev/null; then
        ab -t 60 -c $concurrency $target_url/api/health
    else
        log_warning "No load testing tool available (hey or ab)"
    fi
}

# Monitoring and alerting
setup_monitoring_alerts() {
    local environment=$1
    local webhook_url=${2:-$SLACK_WEBHOOK_URL}
    
    log_info "Setting up monitoring alerts for $environment"
    
    # Configure Prometheus alerts
    if kubectl get namespace monitoring &> /dev/null; then
        kubectl apply -f deployment/monitoring/prometheus-rules.yaml -n monitoring
    fi
    
    # Send deployment notification
    if [ ! -z "$webhook_url" ]; then
        send_slack_notification "🚀 Deployment completed for $environment" "$webhook_url"
    fi
}

# Slack notifications
send_slack_notification() {
    local message=$1
    local webhook_url=${2:-$SLACK_WEBHOOK_URL}
    local color=${3:-"good"}
    
    if [ -z "$webhook_url" ]; then
        log_warning "Slack webhook URL not provided, skipping notification"
        return 0
    fi
    
    local payload=$(cat <<EOF
{
    "attachments": [
        {
            "color": "$color",
            "title": "WhatsDeX AI Bot Deployment",
            "text": "$message",
            "footer": "CI/CD Pipeline",
            "ts": $(date +%s)
        }
    ]
}
EOF
)
    
    curl -X POST -H 'Content-type: application/json' --data "$payload" "$webhook_url"
}

# Rollback helpers
rollback_deployment() {
    local platform=$1
    local previous_version=$2
    
    log_warning "Initiating rollback to version $previous_version on $platform"
    
    case $platform in
        "kubernetes")
            kubectl rollout undo deployment/whatsdx-bot -n whatsdx-ai
            kubectl rollout undo deployment/whatsdx-web -n whatsdx-ai
            ;;
        "docker-compose")
            # Update image tags to previous version
            sed -i "s|:latest|:$previous_version|g" deployment/production.docker-compose.yml
            docker-compose -f deployment/production.docker-compose.yml up -d
            ;;
        *)
            log_error "Unknown platform for rollback: $platform"
            return 1
            ;;
    esac
    
    log_success "Rollback initiated"
}

# Cloud-specific helpers
aws_get_cluster_status() {
    local cluster_name=${1:-"whatsdx-production"}
    local region=${2:-"us-west-2"}
    
    aws eks describe-cluster --name $cluster_name --region $region --query 'cluster.status' --output text
}

gcp_get_cluster_status() {
    local cluster_name=${1:-"whatsdx-production"}
    local zone=${2:-"us-central1-a"}
    local project=${3:-$GOOGLE_CLOUD_PROJECT}
    
    gcloud container clusters describe $cluster_name --zone=$zone --project=$project --format="value(status)"
}

azure_get_cluster_status() {
    local cluster_name=${1:-"whatsdx-production"}
    local resource_group=${2:-"whatsdx-rg"}
    
    az aks show --name $cluster_name --resource-group $resource_group --query 'powerState.code' -o tsv
}

# Configuration validation
validate_environment_config() {
    local environment=$1
    
    log_info "Validating environment configuration for $environment"
    
    # Check required environment variables
    local required_vars=(
        "GEMINI_API_KEY"
        "POSTGRES_PASSWORD"
        "REDIS_PASSWORD"
        "JWT_SECRET"
        "NEXTAUTH_SECRET"
    )
    
    local missing_vars=()
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        log_error "Missing required environment variables: ${missing_vars[*]}"
        return 1
    fi
    
    log_success "Environment configuration validation passed"
    return 0
}

# Cleanup helpers
cleanup_old_images() {
    local keep_count=${1:-5}
    
    log_info "Cleaning up old Docker images, keeping $keep_count latest"
    
    # Remove old images
    docker image prune -f
    
    # Remove untagged images
    docker images --filter "dangling=true" -q | xargs -r docker rmi
    
    log_success "Docker cleanup completed"
}

cleanup_old_deployments() {
    local namespace=${1:-"whatsdx-ai"}
    local keep_count=${2:-3}
    
    log_info "Cleaning up old ReplicaSets in namespace $namespace"
    
    # Get old replicasets and delete them
    kubectl get replicaset -n $namespace --sort-by=.metadata.creationTimestamp -o name | head -n -$keep_count | xargs -r kubectl delete -n $namespace
    
    log_success "Kubernetes cleanup completed"
}

# Export functions for use in other scripts
export -f log_info log_success log_warning log_error
export -f generate_version build_and_push_image
export -f wait_for_service k8s_wait_for_rollout k8s_get_external_ip
export -f run_migrations scan_image_security run_load_test
export -f setup_monitoring_alerts send_slack_notification
export -f rollback_deployment validate_environment_config
export -f cleanup_old_images cleanup_old_deployments
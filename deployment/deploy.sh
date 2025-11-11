#!/bin/bash

# WhatsDeX API-Based Production Deployment Script
# This script handles the complete deployment process for the API-based architecture.

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOYMENT_TYPE=${1:-"fresh"}  # Only 'fresh' is supported for now
ENVIRONMENT=${2:-"production"}
PROJECT_NAME="whatsdex"
COMPOSE_FILE="deployment/docker-compose.prod.yml"
BACKUP_DIR="/tmp/whatsdex-backup-$(date +%Y%m%d-%H%M%S)"
LOG_FILE="/var/log/whatsdex-deployment.log"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a $LOG_FILE
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a $LOG_FILE
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a $LOG_FILE
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a $LOG_FILE
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking deployment prerequisites..."

    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed or not in PATH"
        exit 1
    fi

    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed or not in PATH"
        exit 1
    fi

    # Check if .env exists
    if [ ! -f ".env" ]; then
        print_error "Environment file not found: .env"
        print_warning "Please copy suggestions.md to .env and fill in the values."
        exit 1
    fi

    print_success "Prerequisites check completed"
}

# Function to create backup
create_backup() {
    print_status "Creating backup of current deployment..."

    mkdir -p $BACKUP_DIR

    # Backup database
    if docker ps | grep -q "whatsdex-db"; then
        print_status "Backing up PostgreSQL database..."
        docker exec whatsdex-db pg_dump -U ${POSTGRES_USER} ${POSTGRES_DB} > $BACKUP_DIR/database.sql
    fi

    # Backup Redis data
    if docker ps | grep -q "whatsdex-redis"; then
        print_status "Backing up Redis data..."
        docker exec whatsdex-redis redis-cli --rdb /data/dump.rdb
        docker cp whatsdex-redis:/data/dump.rdb $BACKUP_DIR/redis-dump.rdb
    fi

    print_success "Backup created at: $BACKUP_DIR"
}

# Function for fresh deployment
deploy_fresh() {
    print_status "Starting fresh deployment..."

    # Stop all existing services
    print_status "Stopping existing services..."
    docker-compose -f $COMPOSE_FILE down --volumes

    # Remove old images (optional, saves space)
    print_status "Cleaning up old Docker images..."
    docker image prune -f

    # Deploy fresh environment
    print_status "Starting fresh environment..."
    docker-compose -f $COMPOSE_FILE up -d --build

    # Wait for services to become healthy
    print_status "Waiting for services to initialize and become healthy..."
    for i in {1..30}; do
        backend_status=$(docker-compose -f $COMPOSE_FILE ps backend | grep 'healthy' || echo "")
        frontend_status=$(docker-compose -f $COMPOSE_FILE ps frontend | grep 'healthy' || echo "")
        if [ -n "$backend_status" ] && [ -n "$frontend_status" ]; then
            print_success "Backend and Frontend services are healthy."
            break
        fi
        print_status "Waiting for services... ($i/30)"
        sleep 10
    done

    # Final health check
    print_status "Performing final health checks..."
    docker-compose -f $COMPOSE_FILE ps

    print_success "Fresh deployment completed successfully"
}

# Function to run post-deployment tasks
post_deployment_tasks() {
    print_status "Running post-deployment tasks..."

    # Run database migrations
    print_status "Running database migrations..."
    docker-compose -f $COMPOSE_FILE exec backend npm run migrate

    # Generate Prisma client
    print_status "Generating Prisma client..."
    docker-compose -f $COMPOSE_FILE exec backend npm run generate

    # Send deployment notification
    print_status "Sending deployment notification..."
    if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
             --data '{"text":"🚀 WhatsDeX API-Based deployment completed successfully in '"$ENVIRONMENT"'"}' \
             $SLACK_WEBHOOK_URL
    fi

    print_success "Post-deployment tasks completed"
}

# Function to display deployment summary
deployment_summary() {
    print_success "==============================================="
    print_success "    WhatsDeX API-Based Deployment Complete"
    print_success "==============================================="
    echo ""
    print_status "Deployment Details:"
    echo "  - Deployment Type: $DEPLOYMENT_TYPE"
    echo "  - Environment: $ENVIRONMENT"
    echo "  - Backup Location: $BACKUP_DIR"
    echo "  - Log File: $LOG_FILE"
    echo ""
    print_status "Service URLs:"
    echo "  - Frontend: http://localhost:3000"
    echo "  - Backend API: http://localhost:3001"
    echo "  - Grafana: http://localhost:3002"
    echo "  - Prometheus: http://localhost:9090"
    echo ""
    if [ ! -z "$DOMAIN" ]; then
        print_status "Public URLs:"
        echo "  - Main Site: https://$DOMAIN"
        echo "  - API: https://api.$DOMAIN"
        echo ""
    fi
    print_status "Next Steps:"
    echo "  1. Monitor application logs: docker-compose -f $COMPOSE_FILE logs -f"
    echo "  2. Access Grafana dashboard to verify metrics"
    echo "  3. Test the application functionality"
    echo ""
}

# Main deployment function
main() {
    print_status "Starting WhatsDeX API-Based deployment..."
    print_status "Deployment type: $DEPLOYMENT_TYPE"
    print_status "Environment: $ENVIRONMENT"

    # Create log file
    touch $LOG_FILE

    # Run deployment steps
    check_prerequisites
    create_backup

    # Execute deployment based on type
    case $DEPLOYMENT_TYPE in
        "fresh")
            deploy_fresh
            ;;
        *)
            print_error "Unknown deployment type: $DEPLOYMENT_TYPE"
            echo "Available types: fresh"
            exit 1
            ;;
    esac

    # Post-deployment tasks
    post_deployment_tasks
    deployment_summary

    print_success "Deployment completed successfully! 🎉"
}

# Error handling
trap 'print_error "Deployment failed at line $LINENO. Check logs: $LOG_FILE"' ERR

# Help function
show_help() {
    echo "WhatsDeX API-Based Deployment Script"
    echo ""
    echo "Usage: $0 [DEPLOYMENT_TYPE] [ENVIRONMENT]"
    echo ""
    echo "DEPLOYMENT_TYPE:"
    echo "  fresh       - Fresh deployment (stops all services first)"
    echo ""
    echo "ENVIRONMENT:"
    echo "  production  - Production environment (default)"
    echo "  staging     - Staging environment"
    echo ""
    echo "Examples:"
    echo "  $0 fresh production"
    echo ""
    echo "Environment variables from .env file will be used."
    echo ""
}

# Check for help flag
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_help
    exit 0
fi

# Run main function
main "$@"
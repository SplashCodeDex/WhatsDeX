#!/bin/bash

# WhatsDeX AI Bot - Production Deployment Script
# This script handles the complete deployment process with zero-downtime deployment

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOYMENT_TYPE=${1:-"blue-green"}  # blue-green, rolling, or fresh
ENVIRONMENT=${2:-"production"}
PROJECT_NAME="whatsdx-ai"
BACKUP_DIR="/tmp/whatsdx-backup-$(date +%Y%m%d-%H%M%S)"
LOG_FILE="/var/log/whatsdx-deployment.log"

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
    
    # Check if .env.production exists
    if [ ! -f "deployment/.env.production" ]; then
        print_error "Production environment file not found: deployment/.env.production"
        exit 1
    fi
    
    # Check available disk space (need at least 5GB)
    AVAILABLE_SPACE=$(df / | awk 'NR==2 {print $4}')
    if [ $AVAILABLE_SPACE -lt 5242880 ]; then  # 5GB in KB
        print_warning "Low disk space detected. Consider freeing up space before deployment."
    fi
    
    print_success "Prerequisites check completed"
}

# Function to create backup
create_backup() {
    print_status "Creating backup of current deployment..."
    
    mkdir -p $BACKUP_DIR
    
    # Backup database
    if docker ps | grep -q "${PROJECT_NAME}-postgres"; then
        print_status "Backing up PostgreSQL database..."
        docker exec ${PROJECT_NAME}-postgres pg_dump -U ${POSTGRES_USER:-whatsdx_user} ${POSTGRES_DB:-whatsdx_production} > $BACKUP_DIR/database.sql
    fi
    
    # Backup Redis data
    if docker ps | grep -q "${PROJECT_NAME}-redis"; then
        print_status "Backing up Redis data..."
        docker exec ${PROJECT_NAME}-redis redis-cli --rdb /data/backup.rdb
        docker cp ${PROJECT_NAME}-redis:/data/backup.rdb $BACKUP_DIR/redis-backup.rdb
    fi
    
    # Backup authentication data
    if [ -d "./auth" ]; then
        print_status "Backing up authentication data..."
        cp -r ./auth $BACKUP_DIR/
    fi
    
    # Backup logs
    if [ -d "./logs" ]; then
        print_status "Backing up logs..."
        cp -r ./logs $BACKUP_DIR/
    fi
    
    print_success "Backup created at: $BACKUP_DIR"
}

# Function to validate environment configuration
validate_environment() {
    print_status "Validating environment configuration..."
    
    # Load environment variables
    source deployment/.env.production
    
    # Check required variables
    REQUIRED_VARS=(
        "GEMINI_API_KEY"
        "POSTGRES_PASSWORD"
        "REDIS_PASSWORD"
        "JWT_SECRET"
        "NEXTAUTH_SECRET"
    )
    
    for var in "${REQUIRED_VARS[@]}"; do
        if [ -z "${!var}" ]; then
            print_error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    # Validate API keys format (basic check)
    if [[ ! $GEMINI_API_KEY =~ ^AIza ]]; then
        print_warning "Gemini API key format seems incorrect"
    fi
    
    print_success "Environment validation completed"
}

# Function for blue-green deployment
deploy_blue_green() {
    print_status "Starting blue-green deployment..."
    
    # Determine current and new environments
    if docker ps | grep -q "${PROJECT_NAME}-blue"; then
        CURRENT_ENV="blue"
        NEW_ENV="green"
    else
        CURRENT_ENV="green"
        NEW_ENV="blue"
    fi
    
    print_status "Current environment: $CURRENT_ENV, Deploying to: $NEW_ENV"
    
    # Build new environment
    print_status "Building $NEW_ENV environment..."
    docker-compose -f deployment/production.docker-compose.yml -p ${PROJECT_NAME}-${NEW_ENV} up -d --build
    
    # Health check for new environment
    print_status "Performing health checks on $NEW_ENV environment..."
    sleep 30  # Allow services to start
    
    # Check bot service health
    if ! curl -f http://localhost:3000/api/health &>/dev/null; then
        print_error "Health check failed for bot service in $NEW_ENV environment"
        print_status "Rolling back..."
        docker-compose -f deployment/production.docker-compose.yml -p ${PROJECT_NAME}-${NEW_ENV} down
        exit 1
    fi
    
    # Check web dashboard health
    if ! curl -f http://localhost:3001/api/health &>/dev/null; then
        print_error "Health check failed for web dashboard in $NEW_ENV environment"
        print_status "Rolling back..."
        docker-compose -f deployment/production.docker-compose.yml -p ${PROJECT_NAME}-${NEW_ENV} down
        exit 1
    fi
    
    print_success "Health checks passed for $NEW_ENV environment"
    
    # Switch traffic to new environment (update nginx configuration)
    print_status "Switching traffic to $NEW_ENV environment..."
    
    # Update nginx configuration to point to new environment
    sed -i "s/${CURRENT_ENV}/${NEW_ENV}/g" nginx/nginx.prod.conf
    docker exec ${PROJECT_NAME}-nginx nginx -s reload
    
    # Wait a bit for traffic to switch
    sleep 10
    
    # Final health check
    if curl -f http://localhost/api/health &>/dev/null; then
        print_success "Traffic successfully switched to $NEW_ENV environment"
        
        # Clean up old environment
        print_status "Cleaning up $CURRENT_ENV environment..."
        docker-compose -f deployment/production.docker-compose.yml -p ${PROJECT_NAME}-${CURRENT_ENV} down
        
        print_success "Blue-green deployment completed successfully"
    else
        print_error "Final health check failed, rolling back..."
        # Rollback nginx configuration
        sed -i "s/${NEW_ENV}/${CURRENT_ENV}/g" nginx/nginx.prod.conf
        docker exec ${PROJECT_NAME}-nginx nginx -s reload
        # Clean up failed environment
        docker-compose -f deployment/production.docker-compose.yml -p ${PROJECT_NAME}-${NEW_ENV} down
        exit 1
    fi
}

# Function for rolling deployment
deploy_rolling() {
    print_status "Starting rolling deployment..."
    
    # Update services one by one
    SERVICES=("whatsdx-bot" "whatsdx-web" "redis" "postgres")
    
    for service in "${SERVICES[@]}"; do
        print_status "Updating service: $service"
        
        # Scale up new instance
        docker-compose -f deployment/production.docker-compose.yml scale $service=2
        sleep 15  # Allow new instance to start
        
        # Health check new instance
        if ! docker-compose -f deployment/production.docker-compose.yml exec $service curl -f http://localhost/health &>/dev/null; then
            print_warning "Health check failed for new $service instance, continuing with old instance"
            docker-compose -f deployment/production.docker-compose.yml scale $service=1
            continue
        fi
        
        # Scale down to 1 (removes old instance)
        docker-compose -f deployment/production.docker-compose.yml scale $service=1
        
        print_success "Service $service updated successfully"
        sleep 5  # Brief pause between services
    done
    
    print_success "Rolling deployment completed"
}

# Function for fresh deployment
deploy_fresh() {
    print_status "Starting fresh deployment..."
    
    # Stop all existing services
    print_status "Stopping existing services..."
    docker-compose -f deployment/production.docker-compose.yml down
    
    # Remove old images (optional, saves space)
    print_status "Cleaning up old Docker images..."
    docker image prune -f
    
    # Deploy fresh environment
    print_status "Starting fresh environment..."
    docker-compose -f deployment/production.docker-compose.yml up -d --build
    
    # Wait for services to start
    print_status "Waiting for services to initialize..."
    sleep 60
    
    # Health checks
    print_status "Performing health checks..."
    
    # Check each service
    SERVICES=("bot" "web" "redis" "postgres")
    for service in "${SERVICES[@]}"; do
        if ! docker-compose -f deployment/production.docker-compose.yml ps $service | grep -q "Up"; then
            print_error "Service $service is not running"
            exit 1
        fi
    done
    
    print_success "Fresh deployment completed successfully"
}

# Function to run post-deployment tasks
post_deployment_tasks() {
    print_status "Running post-deployment tasks..."
    
    # Run database migrations
    print_status "Running database migrations..."
    docker-compose -f deployment/production.docker-compose.yml exec whatsdx-bot npm run migrate
    
    # Generate Prisma client
    print_status "Generating Prisma client..."
    docker-compose -f deployment/production.docker-compose.yml exec whatsdx-bot npm run generate
    
    # Warm up caches
    print_status "Warming up application caches..."
    curl -s http://localhost/api/health > /dev/null
    curl -s http://localhost/analytics-dashboard > /dev/null
    
    # Send deployment notification
    print_status "Sending deployment notification..."
    if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
             --data '{"text":"🚀 WhatsDeX AI Bot deployed successfully to '"$ENVIRONMENT"'"}' \
             $SLACK_WEBHOOK_URL
    fi
    
    print_success "Post-deployment tasks completed"
}

# Function to monitor deployment
monitor_deployment() {
    print_status "Starting deployment monitoring..."
    
    # Monitor for 5 minutes
    for i in {1..30}; do
        sleep 10
        
        # Check service health
        if ! curl -f http://localhost/api/health &>/dev/null; then
            print_error "Health check failed during monitoring (attempt $i/30)"
            if [ $i -eq 30 ]; then
                print_error "Deployment monitoring failed - manual intervention required"
                exit 1
            fi
        else
            print_status "Health check passed (attempt $i/30)"
        fi
    done
    
    print_success "Deployment monitoring completed successfully"
}

# Function to setup SSL certificates
setup_ssl() {
    print_status "Setting up SSL certificates..."
    
    if [ ! -z "$DOMAIN" ]; then
        # Check if using Let's Encrypt
        if [ "$USE_LETSENCRYPT" = "true" ]; then
            print_status "Setting up Let's Encrypt SSL certificates..."
            
            # Install certbot if not present
            if ! command -v certbot &> /dev/null; then
                print_status "Installing certbot..."
                apt-get update && apt-get install -y certbot python3-certbot-nginx
            fi
            
            # Get SSL certificate
            certbot --nginx -d $DOMAIN -d api.$DOMAIN -d dashboard.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
            
            # Setup auto-renewal
            echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
            
            print_success "Let's Encrypt SSL certificates configured"
        else
            print_warning "Custom SSL certificates should be placed in deployment/ssl/ directory"
        fi
    else
        print_warning "No domain configured, skipping SSL setup"
    fi
}

# Function to display deployment summary
deployment_summary() {
    print_success "==============================================="
    print_success "       WhatsDeX AI Bot Deployment Complete"
    print_success "==============================================="
    echo ""
    print_status "Deployment Details:"
    echo "  - Deployment Type: $DEPLOYMENT_TYPE"
    echo "  - Environment: $ENVIRONMENT"
    echo "  - Backup Location: $BACKUP_DIR"
    echo "  - Log File: $LOG_FILE"
    echo ""
    print_status "Service URLs:"
    echo "  - Bot API: http://localhost:3000"
    echo "  - Analytics Dashboard: http://localhost:3001"
    echo "  - Grafana: http://localhost:3002"
    echo "  - Prometheus: http://localhost:9090"
    echo ""
    if [ ! -z "$DOMAIN" ]; then
        print_status "Public URLs:"
        echo "  - Main Site: https://$DOMAIN"
        echo "  - API: https://api.$DOMAIN"
        echo "  - Dashboard: https://dashboard.$DOMAIN"
        echo ""
    fi
    print_status "Next Steps:"
    echo "  1. Monitor application logs: docker-compose logs -f"
    echo "  2. Access analytics dashboard to verify AI metrics"
    echo "  3. Test WhatsApp bot functionality"
    echo "  4. Configure monitoring alerts"
    echo ""
}

# Main deployment function
main() {
    print_status "Starting WhatsDeX AI Bot deployment..."
    print_status "Deployment type: $DEPLOYMENT_TYPE"
    print_status "Environment: $ENVIRONMENT"
    
    # Create log file
    touch $LOG_FILE
    
    # Run deployment steps
    check_prerequisites
    validate_environment
    create_backup
    setup_ssl
    
    # Execute deployment based on type
    case $DEPLOYMENT_TYPE in
        "blue-green")
            deploy_blue_green
            ;;
        "rolling")
            deploy_rolling
            ;;
        "fresh")
            deploy_fresh
            ;;
        *)
            print_error "Unknown deployment type: $DEPLOYMENT_TYPE"
            echo "Available types: blue-green, rolling, fresh"
            exit 1
            ;;
    esac
    
    # Post-deployment tasks
    post_deployment_tasks
    monitor_deployment
    deployment_summary
    
    print_success "Deployment completed successfully! 🎉"
}

# Error handling
trap 'print_error "Deployment failed at line $LINENO. Check logs: $LOG_FILE"' ERR

# Help function
show_help() {
    echo "WhatsDeX AI Bot Deployment Script"
    echo ""
    echo "Usage: $0 [DEPLOYMENT_TYPE] [ENVIRONMENT]"
    echo ""
    echo "DEPLOYMENT_TYPE:"
    echo "  blue-green  - Zero-downtime deployment with blue-green strategy (default)"
    echo "  rolling     - Rolling update deployment"
    echo "  fresh       - Fresh deployment (stops all services first)"
    echo ""
    echo "ENVIRONMENT:"
    echo "  production  - Production environment (default)"
    echo "  staging     - Staging environment"
    echo ""
    echo "Examples:"
    echo "  $0                           # Blue-green deployment to production"
    echo "  $0 rolling production        # Rolling deployment to production"
    echo "  $0 fresh staging             # Fresh deployment to staging"
    echo ""
    echo "Environment variables:"
    echo "  SLACK_WEBHOOK_URL           # Optional: Slack webhook for notifications"
    echo "  USE_LETSENCRYPT=true        # Optional: Use Let's Encrypt for SSL"
    echo "  DOMAIN=yourdomain.com       # Optional: Domain for SSL setup"
    echo ""
}

# Check for help flag
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_help
    exit 0
fi

# Run main function
main "$@"
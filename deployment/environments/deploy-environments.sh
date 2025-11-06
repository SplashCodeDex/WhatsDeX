#!/bin/bash

# WhatsDeX AI Bot - Multi-Environment Deployment Script
# Deploy to testing, staging, or production environments

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
ENVIRONMENT=${1:-"testing"}
ACTION=${2:-"deploy"}
COMPOSE_FILE=""
ENV_FILE=""

print_status() {
    echo -e "${BLUE}[ENV-DEPLOY]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Show help
show_help() {
    echo "WhatsDeX AI Bot - Multi-Environment Deployment"
    echo ""
    echo "Usage: $0 [ENVIRONMENT] [ACTION]"
    echo ""
    echo "ENVIRONMENTS:"
    echo "  testing     - Isolated testing environment with mocks"
    echo "  staging     - Pre-production testing environment"
    echo "  production  - Production environment"
    echo ""
    echo "ACTIONS:"
    echo "  deploy      - Deploy the environment"
    echo "  stop        - Stop the environment"
    echo "  restart     - Restart the environment"
    echo "  logs        - View environment logs"
    echo "  status      - Check environment status"
    echo "  test        - Run environment tests"
    echo "  clean       - Clean up environment"
    echo ""
    echo "Examples:"
    echo "  $0 testing deploy     # Deploy testing environment"
    echo "  $0 staging restart    # Restart staging environment"
    echo "  $0 production status  # Check production status"
    echo ""
    echo "Compliance Options:"
    echo "  --gdpr       Enable GDPR compliance"
    echo "  --hipaa      Enable HIPAA compliance"
    echo "  --soc2       Enable SOC2 compliance"
    echo "  --iso27001   Enable ISO27001 compliance"
    echo ""
}

# Validate environment
validate_environment() {
    case $ENVIRONMENT in
        "testing")
            COMPOSE_FILE="deployment/environments/testing/docker-compose.testing.yml"
            ENV_FILE="deployment/environments/.env.testing"
            ;;
        "staging")
            COMPOSE_FILE="deployment/environments/staging/docker-compose.staging.yml"
            ENV_FILE="deployment/environments/.env.staging"
            ;;
        "production")
            COMPOSE_FILE="deployment/production.docker-compose.yml"
            ENV_FILE="deployment/.env.production"
            ;;
        *)
            print_error "Invalid environment: $ENVIRONMENT"
            echo "Valid environments: testing, staging, production"
            exit 1
            ;;
    esac
    
    # Check if files exist
    if [ ! -f "$COMPOSE_FILE" ]; then
        print_error "Compose file not found: $COMPOSE_FILE"
        exit 1
    fi
    
    if [ ! -f "$ENV_FILE" ]; then
        print_error "Environment file not found: $ENV_FILE"
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites for $ENVIRONMENT environment..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check environment file
    if [ ! -f "$ENV_FILE" ]; then
        print_warning "Environment file not found: $ENV_FILE"
        print_status "Creating template environment file..."
        cp "deployment/environments/.env.template" "$ENV_FILE"
        print_warning "Please edit $ENV_FILE with your configuration"
    fi
    
    print_success "Prerequisites check completed"
}

# Apply compliance configurations
apply_compliance() {
    print_status "Checking compliance requirements..."
    
    # Check command line arguments for compliance flags
    if [[ "$*" == *"--gdpr"* ]]; then
        print_status "Applying GDPR compliance configuration..."
        kubectl apply -f deployment/compliance/gdpr-compliance.yml || true
    fi
    
    if [[ "$*" == *"--hipaa"* ]]; then
        print_status "Applying HIPAA compliance configuration..."
        kubectl apply -f deployment/compliance/hipaa-compliance.yml || true
    fi
    
    if [[ "$*" == *"--soc2"* ]]; then
        print_status "Applying SOC2 compliance configuration..."
        kubectl apply -f deployment/compliance/soc2-compliance.yml || true
    fi
    
    if [[ "$*" == *"--iso27001"* ]]; then
        print_status "Applying ISO27001 compliance configuration..."
        kubectl apply -f deployment/compliance/iso27001-compliance.yml || true
    fi
}

# Deploy environment
deploy_environment() {
    print_status "Deploying $ENVIRONMENT environment..."
    
    # Source environment variables
    export $(grep -v '^#' $ENV_FILE | xargs)
    
    # Apply compliance if requested
    apply_compliance "$@"
    
    # Deploy based on environment
    case $ENVIRONMENT in
        "testing")
            deploy_testing_environment
            ;;
        "staging")
            deploy_staging_environment
            ;;
        "production")
            deploy_production_environment
            ;;
    esac
}

# Deploy testing environment
deploy_testing_environment() {
    print_status "Deploying testing environment with comprehensive test suite..."
    
    # Build and start services
    docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d --build
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 30
    
    # Seed test data
    print_status "Seeding test data..."
    docker-compose -f $COMPOSE_FILE --profile seeding up --abort-on-container-exit
    
    # Run health checks
    print_status "Running health checks..."
    docker-compose -f $COMPOSE_FILE exec -T whatsdx-bot-testing curl -f http://localhost:3000/api/health
    docker-compose -f $COMPOSE_FILE exec -T whatsdx-web-testing curl -f http://localhost:3000/api/health
    
    print_success "Testing environment deployed successfully"
    print_status "Access URLs:"
    echo "  - Bot API: http://localhost:3020"
    echo "  - Web Dashboard: http://localhost:3021"
    echo "  - Test Dashboard: http://localhost:3022"
    echo "  - Prometheus: http://localhost:9110"
}

# Deploy staging environment
deploy_staging_environment() {
    print_status "Deploying staging environment with production-like configuration..."
    
    # Build and start services
    docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d --build
    
    # Wait for services to be ready
    print_status "Waiting for services to initialize..."
    sleep 45
    
    # Run database migrations
    print_status "Running database migrations..."
    docker-compose -f $COMPOSE_FILE exec -T whatsdx-bot-staging npm run migrate
    
    # Generate Prisma client
    print_status "Generating Prisma client..."
    docker-compose -f $COMPOSE_FILE exec -T whatsdx-bot-staging npm run generate
    
    # Run health checks
    print_status "Running comprehensive health checks..."
    docker-compose -f $COMPOSE_FILE exec -T whatsdx-bot-staging curl -f http://localhost:3000/api/health
    docker-compose -f $COMPOSE_FILE exec -T whatsdx-web-staging curl -f http://localhost:3000/api/health
    
    # Run staging tests
    print_status "Running staging validation tests..."
    run_staging_tests
    
    print_success "Staging environment deployed successfully"
    print_status "Access URLs:"
    echo "  - Bot API: http://localhost:3010"
    echo "  - Web Dashboard: http://localhost:3011"
    echo "  - Monitoring: http://localhost:3012"
    echo "  - Load Balancer: http://localhost:8080"
}

# Deploy production environment
deploy_production_environment() {
    print_status "Deploying production environment..."
    print_warning "This will deploy to production. Are you sure? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        print_status "Production deployment cancelled"
        exit 0
    fi
    
    # Use the main production deployment script
    ./deployment/deploy.sh blue-green production
    
    print_success "Production environment deployment initiated"
}

# Stop environment
stop_environment() {
    print_status "Stopping $ENVIRONMENT environment..."
    
    docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE down
    
    print_success "$ENVIRONMENT environment stopped"
}

# Restart environment
restart_environment() {
    print_status "Restarting $ENVIRONMENT environment..."
    
    stop_environment
    sleep 5
    deploy_environment "$@"
}

# View logs
view_logs() {
    print_status "Viewing logs for $ENVIRONMENT environment..."
    
    if [ -z "$3" ]; then
        # Show all logs
        docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE logs -f
    else
        # Show specific service logs
        docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE logs -f $3
    fi
}

# Check status
check_status() {
    print_status "Checking status of $ENVIRONMENT environment..."
    
    docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE ps
    
    echo ""
    print_status "Health Checks:"
    
    # Get the appropriate ports based on environment
    case $ENVIRONMENT in
        "testing")
            BOT_PORT=3020
            WEB_PORT=3021
            ;;
        "staging")
            BOT_PORT=3010
            WEB_PORT=3011
            ;;
        "production")
            BOT_PORT=3000
            WEB_PORT=3001
            ;;
    esac
    
    # Check bot health
    if curl -f http://localhost:$BOT_PORT/api/health &>/dev/null; then
        print_success "Bot API is healthy"
    else
        print_error "Bot API is not responding"
    fi
    
    # Check web health
    if curl -f http://localhost:$WEB_PORT/api/health &>/dev/null; then
        print_success "Web Dashboard is healthy"
    else
        print_error "Web Dashboard is not responding"
    fi
}

# Run tests
run_tests() {
    print_status "Running tests for $ENVIRONMENT environment..."
    
    case $ENVIRONMENT in
        "testing")
            run_testing_environment_tests
            ;;
        "staging")
            run_staging_tests
            ;;
        "production")
            run_production_tests
            ;;
    esac
}

# Run testing environment tests
run_testing_environment_tests() {
    print_status "Running comprehensive test suite..."
    
    # Unit and integration tests
    print_status "Running unit and integration tests..."
    docker-compose -f $COMPOSE_FILE --profile testing up --abort-on-container-exit
    
    # Performance tests
    print_status "Running performance tests..."
    docker-compose -f $COMPOSE_FILE --profile performance up --abort-on-container-exit
    
    # API tests
    print_status "Running API tests..."
    docker-compose -f $COMPOSE_FILE --profile api-testing up --abort-on-container-exit
    
    # Security tests
    print_status "Running security tests..."
    docker-compose -f $COMPOSE_FILE --profile security up --abort-on-container-exit
    
    # Load tests
    print_status "Running load tests..."
    docker-compose -f $COMPOSE_FILE --profile load-testing up --abort-on-container-exit
    
    print_success "All tests completed"
}

# Run staging tests
run_staging_tests() {
    print_status "Running staging validation tests..."
    
    # Health checks
    curl -f http://localhost:3010/api/health || exit 1
    curl -f http://localhost:3011/api/health || exit 1
    
    # AI functionality test
    curl -X POST http://localhost:3010/api/test/ai \
        -H "Content-Type: application/json" \
        -d '{"message": "staging test message"}' || exit 1
    
    # Load test (light)
    if command -v hey &> /dev/null; then
        hey -z 30s -c 5 http://localhost:3010/api/health
    fi
    
    print_success "Staging tests passed"
}

# Run production tests
run_production_tests() {
    print_status "Running production health checks..."
    
    # Basic health checks only for production
    curl -f http://localhost:3000/api/health || exit 1
    curl -f http://localhost:3001/api/health || exit 1
    
    print_success "Production health checks passed"
}

# Clean up environment
clean_environment() {
    print_status "Cleaning up $ENVIRONMENT environment..."
    
    # Stop and remove containers
    docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE down -v --remove-orphans
    
    # Remove images
    print_warning "Remove Docker images for $ENVIRONMENT? (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE down --rmi all
    fi
    
    print_success "$ENVIRONMENT environment cleaned up"
}

# Main execution
main() {
    # Check for help
    if [[ "$1" == "-h" || "$1" == "--help" ]]; then
        show_help
        exit 0
    fi
    
    print_status "WhatsDeX AI Bot - Multi-Environment Deployment"
    print_status "Environment: $ENVIRONMENT"
    print_status "Action: $ACTION"
    
    validate_environment
    check_prerequisites
    
    case $ACTION in
        "deploy")
            deploy_environment "$@"
            ;;
        "stop")
            stop_environment
            ;;
        "restart")
            restart_environment "$@"
            ;;
        "logs")
            view_logs "$@"
            ;;
        "status")
            check_status
            ;;
        "test")
            run_tests
            ;;
        "clean")
            clean_environment
            ;;
        *)
            print_error "Invalid action: $ACTION"
            echo "Valid actions: deploy, stop, restart, logs, status, test, clean"
            exit 1
            ;;
    esac
}

# Error handling
trap 'print_error "Environment deployment failed at line $LINENO"' ERR

# Run main function
main "$@"
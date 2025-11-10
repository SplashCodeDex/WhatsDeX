#!/bin/bash

# WhatsDeX Complete Deployment with Monitoring
# Deploys the full stack: Bot + Web + SSL + Monitoring

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_status() {
    if [ "$2" = "SUCCESS" ]; then
        echo -e "${GREEN}✅ $1${NC}"
    elif [ "$2" = "WARNING" ]; then
        echo -e "${YELLOW}⚠️  $1${NC}"
    elif [ "$2" = "ERROR" ]; then
        echo -e "${RED}❌ $1${NC}"
    elif [ "$2" = "INFO" ]; then
        echo -e "${BLUE}ℹ️  $1${NC}"
    elif [ "$2" = "HEADER" ]; then
        echo -e "${PURPLE}🔷 $1${NC}"
    else
        echo "📋 $1"
    fi
}

show_banner() {
    echo -e "${BLUE}"
    echo "██╗    ██╗██╗  ██╗ █████╗ ████████╗███████╗██████╗ ███████╗██╗  ██╗"
    echo "██║    ██║██║  ██║██╔══██╗╚══██╔══╝██╔════╝██╔══██╗██╔════╝╚██╗██╔╝"
    echo "██║ █╗ ██║███████║███████║   ██║   ███████╗██║  ██║█████╗   ╚███╔╝ "
    echo "██║███╗██║██╔══██║██╔══██║   ██║   ╚════██║██║  ██║██╔══╝   ██╔██╗ "
    echo "╚███╔███╔╝██║  ██║██║  ██║   ██║   ███████║██████╔╝███████╗██╔╝ ██╗"
    echo " ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═════╝ ╚══════╝╚═╝  ╚═╝"
    echo -e "${NC}"
    echo -e "${PURPLE}🚀 Complete WhatsDeX Deployment${NC}"
    echo "================================"
}

check_deployment_mode() {
    print_status "Select deployment configuration:" "HEADER"
    echo "1. 🚀 Full Production (Bot + Web + SSL + Monitoring)"
    echo "2. 🧪 Development (Bot + Web + Monitoring)"
    echo "3. 📊 Monitoring Only"
    echo "4. 🔒 Production without Monitoring"
    echo
    read -p "Choose deployment mode (1-4): " DEPLOY_MODE
    
    case $DEPLOY_MODE in
        1)
            DEPLOYMENT_TYPE="production-full"
            COMPOSE_FILES="-f production.docker-compose.yml -f docker-compose.ssl.yml -f monitoring/docker-compose.monitoring.yml"
            print_status "Full production deployment selected" "INFO"
            ;;
        2)
            DEPLOYMENT_TYPE="development"
            COMPOSE_FILES="-f docker-compose.yml -f monitoring/docker-compose.monitoring.yml"
            print_status "Development deployment selected" "INFO"
            ;;
        3)
            DEPLOYMENT_TYPE="monitoring-only"
            COMPOSE_FILES="-f monitoring/docker-compose.monitoring.yml"
            print_status "Monitoring-only deployment selected" "INFO"
            ;;
        4)
            DEPLOYMENT_TYPE="production-basic"
            COMPOSE_FILES="-f production.docker-compose.yml -f docker-compose.ssl.yml"
            print_status "Production without monitoring selected" "INFO"
            ;;
        *)
            print_status "Invalid choice, defaulting to development mode" "WARNING"
            DEPLOYMENT_TYPE="development"
            COMPOSE_FILES="-f docker-compose.yml -f monitoring/docker-compose.monitoring.yml"
            ;;
    esac
}

pre_deployment_checks() {
    print_status "Running pre-deployment checks..." "HEADER"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_status "Docker not found!" "ERROR"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_status "Docker Compose not found!" "ERROR"
        exit 1
    fi
    
    # Check disk space
    AVAILABLE_SPACE=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
    if [ "$AVAILABLE_SPACE" -lt 15 ]; then
        print_status "Warning: Less than 15GB available disk space" "WARNING"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Validate configurations
    print_status "Validating Docker Compose configurations..." "INFO"
    for file in production.docker-compose.yml docker-compose.ssl.yml monitoring/docker-compose.monitoring.yml; do
        if [ -f "$file" ]; then
            if docker-compose -f "$file" config --quiet 2>/dev/null; then
                print_status "✓ $file is valid" "SUCCESS"
            else
                print_status "✗ $file has errors" "ERROR"
                docker-compose -f "$file" config
            fi
        fi
    done
}

setup_environment() {
    print_status "Setting up environment..." "HEADER"
    
    # Set default environment variables
    export GRAFANA_PASSWORD=${GRAFANA_PASSWORD:-admin123}
    export POSTGRES_USER=${POSTGRES_USER:-whatsdx}
    export POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-$(openssl rand -base64 12)}
    export POSTGRES_DB=${POSTGRES_DB:-whatsdx}
    export REDIS_PASSWORD=${REDIS_PASSWORD:-$(openssl rand -base64 12)}
    
    # Production-specific setup
    if [[ "$DEPLOYMENT_TYPE" == "production"* ]]; then
        print_status "Production deployment detected" "INFO"
        
        # Check for SSL certificates
        if [ ! -f "ssl/ssl.crt" ] || [ ! -f "ssl/ssl.key" ]; then
            print_status "SSL certificates not found" "WARNING"
            echo "For production deployment, SSL certificates are recommended."
            echo "Run ./ssl-certificate-manager.sh to set up certificates."
            read -p "Continue without SSL? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                print_status "Please set up SSL certificates first" "INFO"
                exit 1
            fi
        else
            print_status "SSL certificates found" "SUCCESS"
        fi
        
        # Check environment file
        if [ ! -f ".env" ]; then
            print_status "No .env file found, creating from template..." "WARNING"
            if [ -f ".env.production" ]; then
                cp .env.production .env
                print_status "Please edit .env file with your actual values" "WARNING"
            fi
        fi
    fi
    
    print_status "Environment setup completed" "SUCCESS"
}

deploy_services() {
    print_status "Deploying WhatsDeX services..." "HEADER"
    
    # Create networks if they don't exist
    docker network create whatsdx-network 2>/dev/null || true
    
    # Pull latest images
    print_status "Pulling latest images..." "INFO"
    docker-compose $COMPOSE_FILES pull
    
    # Stop existing services
    print_status "Stopping existing services..." "INFO"
    docker-compose $COMPOSE_FILES down --remove-orphans 2>/dev/null || true
    
    # Start services
    print_status "Starting services..." "INFO"
    docker-compose $COMPOSE_FILES up -d
    
    # Wait for services to start
    print_status "Waiting for services to initialize..." "INFO"
    sleep 30
    
    # Health check
    check_service_health
}

check_service_health() {
    print_status "Checking service health..." "HEADER"
    
    # Get list of running containers
    CONTAINERS=$(docker-compose $COMPOSE_FILES ps --services)
    
    for service in $CONTAINERS; do
        if docker-compose $COMPOSE_FILES ps "$service" | grep -q "Up"; then
            print_status "$service is running" "SUCCESS"
        else
            print_status "$service failed to start" "ERROR"
            echo "Checking logs for $service:"
            docker-compose $COMPOSE_FILES logs --tail=10 "$service"
        fi
    done
}

show_deployment_summary() {
    print_status "Deployment Summary" "HEADER"
    
    echo "🎉 WhatsDeX deployment completed!"
    echo
    echo "📊 Deployment Type: $DEPLOYMENT_TYPE"
    echo "🔧 Services Started:"
    docker-compose $COMPOSE_FILES ps --format "table {{.Service}}\t{{.State}}\t{{.Ports}}"
    
    echo
    echo "🌐 Access URLs:"
    
    if [[ "$DEPLOYMENT_TYPE" != "monitoring-only" ]]; then
        if [[ "$DEPLOYMENT_TYPE" == "production"* ]] && [ -f "ssl/ssl.crt" ]; then
            echo "🤖 WhatsDeX Bot: https://yourdomain.com"
            echo "💻 Web Dashboard: https://yourdomain.com:3001"
        else
            echo "🤖 WhatsDeX Bot: http://localhost:3001"
            echo "💻 Web Dashboard: http://localhost:3000"
        fi
    fi
    
    if [[ "$DEPLOYMENT_TYPE" != "production-basic" ]]; then
        echo "📊 Grafana: http://localhost:3002 (admin/admin123)"
        echo "📈 Prometheus: http://localhost:9090"
        echo "🚨 Alertmanager: http://localhost:9093"
    fi
    
    echo
    echo "🔧 Management Commands:"
    echo "├── View logs: docker-compose $COMPOSE_FILES logs -f [service]"
    echo "├── Stop all: docker-compose $COMPOSE_FILES down"
    echo "├── Restart: docker-compose $COMPOSE_FILES restart [service]"
    echo "└── Status: docker-compose $COMPOSE_FILES ps"
    
    if [[ "$DEPLOYMENT_TYPE" != "monitoring-only" ]]; then
        echo
        echo "📱 WhatsApp Setup:"
        echo "1. Scan QR code from bot logs: docker-compose $COMPOSE_FILES logs whatsdx-bot"
        echo "2. Configure your WhatsApp number as admin"
        echo "3. Start using your bot!"
    fi
    
    if [[ "$DEPLOYMENT_TYPE" != "production-basic" ]]; then
        echo
        echo "📊 Monitoring Setup:"
        echo "1. Access Grafana and explore dashboards"
        echo "2. Configure alert channels (Slack, email)"
        echo "3. Customize alert thresholds"
        echo "4. Set up log monitoring"
    fi
}

# Main execution
main() {
    show_banner
    
    check_deployment_mode
    pre_deployment_checks
    setup_environment
    deploy_services
    show_deployment_summary
    
    echo
    print_status "🚀 WhatsDeX deployment completed successfully!" "SUCCESS"
}

# Run if called directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
#!/bin/bash

# WhatsDeX Quick Deployment Script
# Automates the deployment process with validation and setup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ "$2" = "SUCCESS" ]; then
        echo -e "${GREEN}✅ $1${NC}"
    elif [ "$2" = "WARNING" ]; then
        echo -e "${YELLOW}⚠️  $1${NC}"
    elif [ "$2" = "ERROR" ]; then
        echo -e "${RED}❌ $1${NC}"
    elif [ "$2" = "INFO" ]; then
        echo -e "${BLUE}ℹ️  $1${NC}"
    else
        echo "📋 $1"
    fi
}

echo -e "${BLUE}🚀 WhatsDeX Quick Deployment${NC}"
echo "============================="

# Check deployment mode
if [ "$1" = "production" ]; then
    DEPLOY_MODE="production"
    COMPOSE_FILE="production.docker-compose.yml"
    print_status "Production deployment mode selected" "INFO"
elif [ "$1" = "staging" ]; then
    DEPLOY_MODE="staging"
    COMPOSE_FILE="environments/staging/docker-compose.staging.yml"
    print_status "Staging deployment mode selected" "INFO"
else
    DEPLOY_MODE="development"
    COMPOSE_FILE="../docker-compose.yml"
    print_status "Development deployment mode selected" "INFO"
fi

# Run validation first
echo -e "\n1. Running deployment validation..."
if ./validate-deployment.sh > /dev/null 2>&1; then
    print_status "Configuration validation passed" "SUCCESS"
else
    print_status "Configuration validation failed" "ERROR"
    echo "Running detailed validation..."
    ./validate-deployment.sh
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Environment setup
echo -e "\n2. Setting up environment..."
if [ "$DEPLOY_MODE" = "production" ]; then
    if [ ! -f ".env" ]; then
        if [ -f ".env.production" ]; then
            print_status "Creating .env from .env.production template" "INFO"
            cp .env.production .env
            print_status "Please edit .env with your actual values before continuing" "WARNING"
            read -p "Have you configured .env with real values? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                print_status "Please configure .env file first" "ERROR"
                exit 1
            fi
        else
            print_status ".env.production template not found" "ERROR"
            exit 1
        fi
    fi
    print_status "Environment configuration ready" "SUCCESS"
fi

# Create required directories
echo -e "\n3. Creating required directories..."
mkdir -p ssl logs backups
print_status "Required directories created" "SUCCESS"

# SSL setup for production
if [ "$DEPLOY_MODE" = "production" ]; then
    echo -e "\n4. Checking SSL configuration..."
    if [ ! "$(ls -A ssl)" ]; then
        print_status "No SSL certificates found" "WARNING"
        echo "For HTTPS, place your SSL certificates in deployment/ssl/"
        echo "Files needed: ssl.crt, ssl.key"
        read -p "Continue with HTTP only? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "SSL certificates required for production" "ERROR"
            exit 1
        fi
    else
        print_status "SSL certificates found" "SUCCESS"
    fi
fi

# Pull latest images
echo -e "\n5. Pulling latest Docker images..."
if docker-compose -f "$COMPOSE_FILE" pull; then
    print_status "Images pulled successfully" "SUCCESS"
else
    print_status "Some images failed to pull, continuing..." "WARNING"
fi

# Stop existing containers
echo -e "\n6. Stopping existing containers..."
docker-compose -f "$COMPOSE_FILE" down --remove-orphans 2>/dev/null || true
print_status "Existing containers stopped" "SUCCESS"

# Build and start services
echo -e "\n7. Building and starting services..."
if [ "$DEPLOY_MODE" = "production" ]; then
    # Production deployment with build
    docker-compose -f "$COMPOSE_FILE" up -d --build
else
    # Development deployment
    docker-compose -f "$COMPOSE_FILE" up -d
fi

# Wait for services to be healthy
echo -e "\n8. Waiting for services to be ready..."
sleep 10

# Check service health
echo -e "\n9. Checking service health..."
SERVICES=$(docker-compose -f "$COMPOSE_FILE" config --services)
for service in $SERVICES; do
    if docker-compose -f "$COMPOSE_FILE" ps "$service" | grep -q "Up"; then
        print_status "$service is running" "SUCCESS"
    else
        print_status "$service failed to start" "ERROR"
        echo "Checking logs for $service:"
        docker-compose -f "$COMPOSE_FILE" logs --tail=20 "$service"
    fi
done

# Display access information
echo -e "\n🌐 Access Information"
echo "===================="
if [ "$DEPLOY_MODE" = "production" ]; then
    echo "🤖 Bot Service: https://yourdomain.com"
    echo "📊 Web Dashboard: https://yourdomain.com:3001"
    echo "📈 Grafana: https://yourdomain.com:3002"
    echo "📊 Prometheus: https://yourdomain.com:9090"
else
    echo "🤖 Bot Service: http://localhost:3001"
    echo "📊 Web Dashboard: http://localhost:3000"
    echo "📈 Grafana: http://localhost:3002 (admin/admin)"
    echo "📊 Prometheus: http://localhost:9090"
fi

echo -e "\n📋 Management Commands"
echo "====================="
echo "View logs: docker-compose -f $COMPOSE_FILE logs -f [service]"
echo "Stop all: docker-compose -f $COMPOSE_FILE down"
echo "Restart: docker-compose -f $COMPOSE_FILE restart [service]"
echo "Status: docker-compose -f $COMPOSE_FILE ps"

echo -e "\n${GREEN}🎉 Deployment completed successfully!${NC}"

# Show running containers
echo -e "\n📊 Running Containers:"
docker-compose -f "$COMPOSE_FILE" ps
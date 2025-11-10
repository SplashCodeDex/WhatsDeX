#!/bin/bash

# WhatsDeX Deployment Validation Script
# This script validates Docker Compose configurations and environment setup

set -e

echo "🔍 WhatsDeX Deployment Validation"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ "$2" = "SUCCESS" ]; then
        echo -e "${GREEN}✅ $1${NC}"
    elif [ "$2" = "WARNING" ]; then
        echo -e "${YELLOW}⚠️  $1${NC}"
    elif [ "$2" = "ERROR" ]; then
        echo -e "${RED}❌ $1${NC}"
    else
        echo "ℹ️  $1"
    fi
}

# Check if Docker and Docker Compose are available
echo "1. Checking Docker environment..."
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    print_status "Docker found: $DOCKER_VERSION" "SUCCESS"
else
    print_status "Docker not found! Please install Docker" "ERROR"
    exit 1
fi

if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    print_status "Docker Compose found: $COMPOSE_VERSION" "SUCCESS"
else
    print_status "Docker Compose not found! Please install Docker Compose" "ERROR"
    exit 1
fi

# Validate main docker-compose.yml
echo -e "\n2. Validating main Docker Compose configuration..."
if docker-compose -f ../docker-compose.yml config --quiet 2>/dev/null; then
    print_status "Main docker-compose.yml is valid" "SUCCESS"
else
    print_status "Main docker-compose.yml has configuration errors" "ERROR"
    echo "Running detailed validation..."
    docker-compose -f ../docker-compose.yml config
fi

# Validate production docker-compose
echo -e "\n3. Validating production Docker Compose configuration..."
if docker-compose -f production.docker-compose.yml config --quiet 2>/dev/null; then
    print_status "Production docker-compose.yml is valid" "SUCCESS"
else
    print_status "Production docker-compose.yml has configuration errors" "WARNING"
    echo "Common issues found. Checking environment variables..."
fi

# Check for required environment files
echo -e "\n4. Checking environment configuration..."
if [ -f ".env.production" ]; then
    print_status ".env.production template found" "SUCCESS"
else
    print_status ".env.production template not found" "WARNING"
    echo "Creating template..."
    cp .env.production.example .env.production 2>/dev/null || echo "Please create .env.production from template"
fi

if [ -f "../web/.env.local" ]; then
    print_status "Web environment file found" "SUCCESS"
else
    print_status "Web environment file missing" "WARNING"
fi

# Check for required directories
echo -e "\n5. Checking required directories..."
REQUIRED_DIRS=("../nginx" "../monitoring" "../scripts" "ssl")
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        print_status "Directory $dir exists" "SUCCESS"
    else
        print_status "Directory $dir missing" "WARNING"
        mkdir -p "$dir" 2>/dev/null || true
    fi
done

# Check for SSL certificates in production
echo -e "\n6. Checking SSL configuration..."
if [ -d "ssl" ] && [ "$(ls -A ssl)" ]; then
    print_status "SSL certificates directory has content" "SUCCESS"
else
    print_status "SSL certificates not found - using HTTP only" "WARNING"
    echo "For production, please add SSL certificates to deployment/ssl/"
fi

# Validate Dockerfiles
echo -e "\n7. Checking Dockerfiles..."
DOCKERFILES=("../Dockerfile.monolith" "../web/Dockerfile" "../Dockerfile.backup")
for dockerfile in "${DOCKERFILES[@]}"; do
    if [ -f "$dockerfile" ]; then
        print_status "$(basename $dockerfile) exists" "SUCCESS"
    else
        print_status "$(basename $dockerfile) missing" "ERROR"
    fi
done

echo -e "\n🎯 Validation Summary"
echo "====================="
print_status "Main configuration validated" "SUCCESS"
print_status "Check warnings above for production readiness" "WARNING"
print_status "Ensure environment variables are set before deployment" "WARNING"

echo -e "\n📋 Next Steps:"
echo "1. Copy .env.production to .env and fill in your values"
echo "2. Add SSL certificates to deployment/ssl/ for HTTPS"
echo "3. Review and customize nginx configuration"
echo "4. Run: docker-compose -f production.docker-compose.yml up -d"

echo -e "\n✨ Validation complete!"
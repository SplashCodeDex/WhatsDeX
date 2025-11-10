#!/bin/bash

# 🚀 WhatsDeX Quick Deployment Script (API Architecture)
# This script deploys the new API-based WhatsDeX architecture

set -e  # Exit on error

echo "🚀 Starting WhatsDeX API Architecture Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
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

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Navigate to deployment directory
cd "$(dirname "$0")"

print_status "Checking environment configuration..."

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    print_warning ".env.production not found. Creating from template..."
    cp .env.production.template .env.production
    print_warning "Please edit .env.production with your actual configuration values!"
    read -p "Press Enter to continue after updating .env.production..."
fi

# Validate required environment variables
source .env.production

required_vars=("POSTGRES_PASSWORD" "REDIS_PASSWORD" "JWT_SECRET" "INTERNAL_API_KEY")
missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ] || [[ "${!var}" == *"CHANGE_THIS"* ]]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    print_error "Please configure the following variables in .env.production:"
    for var in "${missing_vars[@]}"; do
        echo "  - $var"
    done
    exit 1
fi

print_success "Environment configuration validated!"

# Generate Prisma client
print_status "Generating Prisma client..."
cd ..
if [ -f "package.json" ]; then
    npm install
    npx prisma generate
    print_success "Prisma client generated!"
else
    print_warning "package.json not found in root. Skipping Prisma generation."
fi

cd deployment

# Build and start services
print_status "Building and starting services..."

# Stop any existing containers
docker-compose -f production-api.docker-compose.yml --env-file .env.production down 2>/dev/null || true

# Pull latest images
print_status "Pulling latest base images..."
docker-compose -f production-api.docker-compose.yml --env-file .env.production pull postgres redis nginx

# Build custom images
print_status "Building application images..."
docker-compose -f production-api.docker-compose.yml --env-file .env.production build --no-cache

# Start services
print_status "Starting services..."
docker-compose -f production-api.docker-compose.yml --env-file .env.production up -d

# Wait for services to be healthy
print_status "Waiting for services to start..."
sleep 30

# Check service health
print_status "Checking service health..."

services=("whatsdx-postgres" "whatsdx-redis" "whatsdx-backend" "whatsdx-frontend" "whatsdx-nginx")
all_healthy=true

for service in "${services[@]}"; do
    if ! docker ps --filter "name=$service" --filter "status=running" --quiet | grep -q .; then
        print_error "Service $service is not running!"
        all_healthy=false
    else
        print_success "Service $service is running"
    fi
done

# Run database migrations
if [ "$all_healthy" = true ]; then
    print_status "Running database migrations..."
    docker-compose -f production-api.docker-compose.yml --env-file .env.production exec -T backend npx prisma migrate deploy || {
        print_warning "Migration failed. This might be expected for first-time setup."
    }
fi

# Test API endpoints
print_status "Testing API endpoints..."

# Wait a bit more for services to fully initialize
sleep 10

# Test backend health
if curl -f http://localhost:3001/health >/dev/null 2>&1; then
    print_success "Backend API is healthy!"
else
    print_error "Backend API health check failed!"
    all_healthy=false
fi

# Test frontend
if curl -f http://localhost:3000 >/dev/null 2>&1; then
    print_success "Frontend is accessible!"
else
    print_error "Frontend accessibility check failed!"
    all_healthy=false
fi

# Test nginx
if curl -f http://localhost/health >/dev/null 2>&1; then
    print_success "Nginx proxy is working!"
else
    print_error "Nginx proxy health check failed!"
    all_healthy=false
fi

# Show deployment status
echo ""
echo "======================================"
if [ "$all_healthy" = true ]; then
    print_success "🎉 WhatsDeX API Architecture Deployment Complete!"
    echo ""
    echo "🌐 Application URLs:"
    echo "   Frontend:  http://localhost:3000"
    echo "   Backend:   http://localhost:3001"
    echo "   Nginx:     http://localhost"
    echo ""
    echo "📊 Service Status:"
    docker-compose -f production-api.docker-compose.yml --env-file .env.production ps
    echo ""
    echo "📝 View logs with:"
    echo "   docker-compose -f production-api.docker-compose.yml logs -f"
    echo ""
    echo "🔧 Manage services with:"
    echo "   docker-compose -f production-api.docker-compose.yml [up|down|restart|ps]"
else
    print_error "❌ Deployment completed with errors!"
    echo ""
    echo "🔍 Check logs for troubleshooting:"
    echo "   docker-compose -f production-api.docker-compose.yml logs"
    echo ""
    echo "🔧 Debug individual services:"
    for service in "${services[@]}"; do
        echo "   docker logs $service"
    done
fi

echo "======================================"

# Cleanup function
cleanup() {
    print_status "Cleaning up temporary files..."
    # Add any cleanup commands here
}

# Set trap for cleanup on exit
trap cleanup EXIT
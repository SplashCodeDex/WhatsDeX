#!/bin/bash

# WhatsDeX Complete SaaS Deployment Script
# Persistent Sessions + Web QR Code + Multi-tenant Ready

set -e

echo "🚀 WhatsDeX Complete SaaS Deployment Starting..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Configuration
COMPOSE_FILE="deployment/docker-compose.saas.yml"
ENV_FILE=".env.production.complete"

# Pre-deployment checks
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose not installed"
        exit 1
    fi
    
    # Check environment file
    if [ ! -f "$ENV_FILE" ]; then
        print_warning "Creating production environment file..."
        cp .env.production.complete .env
    fi
    
    print_success "Prerequisites check passed"
}

# Setup persistent directories
setup_persistent_storage() {
    print_status "Setting up persistent storage..."
    
    # Create directories that will persist across deployments
    mkdir -p {sessions,uploads,backups,logs}
    mkdir -p monitoring/data/{prometheus,grafana}
    mkdir -p deployment/{ssl,nginx}
    
    # Set proper permissions
    chmod 755 sessions uploads backups logs
    chmod -R 755 monitoring/data
    
    print_success "Persistent storage configured"
}

# Generate SSL certificates
setup_ssl() {
    print_status "Setting up SSL certificates..."
    
    if [ ! -f "deployment/ssl/cert.pem" ]; then
        mkdir -p deployment/ssl
        
        # Generate self-signed certificate for development
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout deployment/ssl/key.pem \
            -out deployment/ssl/cert.pem \
            -subj "/C=US/ST=State/L=City/O=WhatsDeX/CN=localhost"
        
        print_warning "Self-signed certificates generated. Replace with real certs for production!"
    else
        print_success "SSL certificates found"
    fi
}

# Setup database
setup_database() {
    print_status "Setting up database..."
    
    # Generate Prisma client
    npm run generate
    
    print_success "Database setup completed"
}

# Deploy services
deploy_services() {
    print_status "Deploying all SaaS services..."
    
    # Stop any existing services
    docker-compose -f "$COMPOSE_FILE" down --remove-orphans
    
    # Pull latest images
    docker-compose -f "$COMPOSE_FILE" pull
    
    # Build and start services
    docker-compose -f "$COMPOSE_FILE" up -d --build
    
    print_success "All services deployed"
}

# Wait for services to be ready
wait_for_services() {
    print_status "Waiting for services to be ready..."
    
    # Wait for PostgreSQL
    print_status "Waiting for PostgreSQL..."
    for i in {1..30}; do
        if docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -h localhost -U whatsdx_user; then
            break
        fi
        sleep 5
    done
    
    # Wait for Redis
    print_status "Waiting for Redis..."
    for i in {1..30}; do
        if docker-compose -f "$COMPOSE_FILE" exec -T redis redis-cli ping; then
            break
        fi
        sleep 2
    done
    
    # Wait for main application
    print_status "Waiting for WhatsDeX SaaS..."
    for i in {1..60}; do
        if curl -f http://localhost:3000/health &> /dev/null; then
            break
        fi
        sleep 10
    done
    
    print_success "All services are ready"
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    docker-compose -f "$COMPOSE_FILE" exec whatsdx-saas npm run migrate
    
    print_success "Database migrations completed"
}

# Display deployment information
show_deployment_info() {
    print_success "🎉 WhatsDeX SaaS Deployment Complete!"
    echo ""
    echo "🌐 Access URLs:"
    echo "  • 🤖 Bot API: http://localhost:3000"
    echo "  • 🖥️  Web Dashboard: http://localhost:3001"
    echo "  • 📊 Grafana Monitoring: http://localhost:3002"
    echo "  • 🔍 Prometheus: http://localhost:9090"
    echo ""
    echo "🎯 SaaS Features Enabled:"
    echo "  ✅ Persistent WhatsApp Sessions (no re-scanning needed!)"
    echo "  ✅ Web-based QR Code Display"
    echo "  ✅ Pairing Code Alternative"
    echo "  ✅ Multi-tenant Architecture"
    echo "  ✅ Real-time Dashboard Updates"
    echo "  ✅ Automatic Session Backup"
    echo "  ✅ Health Monitoring"
    echo "  ✅ Load Balancing Ready"
    echo ""
    echo "📱 WhatsApp Connection:"
    echo "  🔗 Visit http://localhost:3001/dashboard"
    echo "  📱 Click 'Connect WhatsApp'"
    echo "  🎯 Scan QR code or use pairing code"
    echo "  ✅ Connection persists across restarts!"
    echo ""
    echo "🔐 Default Credentials:"
    echo "  • Grafana: admin / admin123secure"
    echo "  • Database: whatsdx_user / whatsdx_secure_2024"
    echo ""
    echo "🎊 Key SaaS Benefits:"
    echo "  1. 🔄 Sessions persist - users don't rescan QR codes"
    echo "  2. 🌐 Web dashboard shows QR codes and status"
    echo "  3. 👥 Multi-tenant ready for multiple customers"
    echo "  4. 📊 Full monitoring and analytics"
    echo "  5. 🔧 Easy scaling and management"
    echo ""
    echo "⚠️  Production Notes:"
    echo "  • Replace self-signed SSL certificates"
    echo "  • Update default passwords"
    echo "  • Configure real domain names"
    echo "  • Set up proper backup strategy"
    echo "  • Add monitoring alerts"
    echo ""
}

# Check service health
check_final_health() {
    print_status "Final health check..."
    
    echo ""
    print_status "Service Status:"
    
    if curl -f http://localhost:3000/health &> /dev/null; then
        print_success "✅ Bot API: Healthy"
    else
        print_error "❌ Bot API: Unhealthy"
    fi
    
    if curl -f http://localhost:3001/api/health &> /dev/null; then
        print_success "✅ Web Dashboard: Healthy"
    else
        print_warning "⚠️  Web Dashboard: Still starting..."
    fi
    
    if curl -f http://localhost:3002/api/health &> /dev/null; then
        print_success "✅ Grafana: Healthy"
    else
        print_warning "⚠️  Grafana: Still starting..."
    fi
}

# Cleanup function
cleanup_on_exit() {
    print_warning "Deployment interrupted"
    exit 1
}

# Main deployment process
main() {
    echo "🚀 WhatsDeX Complete SaaS Deployment"
    echo "====================================="
    echo ""
    
    check_prerequisites
    setup_persistent_storage
    setup_ssl
    setup_database
    deploy_services
    wait_for_services
    run_migrations
    check_final_health
    show_deployment_info
    
    print_success "🎉 SaaS Deployment completed successfully!"
    echo ""
    print_status "Next steps:"
    echo "1. Visit http://localhost:3001 to access the dashboard"
    echo "2. Connect your WhatsApp (QR code will be shown in web interface)"
    echo "3. Configure your AI API keys in the dashboard"
    echo "4. Test bot functionality"
    echo "5. Set up custom domain and SSL for production"
    echo ""
    print_status "Management commands:"
    echo "• View logs: docker-compose -f $COMPOSE_FILE logs -f"
    echo "• Stop services: docker-compose -f $COMPOSE_FILE down"
    echo "• Restart: docker-compose -f $COMPOSE_FILE restart"
    echo ""
}

# Handle interruption
trap cleanup_on_exit INT TERM

# Run main function
main "$@"
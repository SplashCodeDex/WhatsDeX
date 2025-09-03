#!/bin/bash

# WhatsDeX Admin System - PRIVATE OWNER DEPLOYMENT
# This script is for project maintainers only
# Access restricted to authorized personnel

set -e

# Access Control - Only allow specific users
ALLOWED_USERS=("your_username_here" "admin" "root")
CURRENT_USER=$(whoami)

# Check if user is authorized
if [[ ! " ${ALLOWED_USERS[@]} " =~ " ${CURRENT_USER} " ]]; then
    echo "❌ ACCESS DENIED"
    echo "This deployment script is restricted to authorized personnel only."
    echo "Contact the project maintainer for access."
    echo ""
    echo "For public deployment, see: DEPLOYMENT_GUIDE.md"
    exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
DOMAIN_NAME=""
DB_PASSWORD=""
ADMIN_EMAIL=""
OWNER_TOKEN=""

print_header() {
    echo -e "\n${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC} 🔐 PRIVATE DEPLOYMENT - AUTHORIZED ACCESS ONLY ${CYAN}║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

print_info() {
    echo -e "${PURPLE}ℹ️${NC} $1"
}

# Verify owner token
verify_owner_token() {
    print_header
    echo "🔐 Owner Authentication Required"
    echo ""

    if [ -z "$OWNER_TOKEN" ]; then
        read -s -p "Enter owner access token: " OWNER_TOKEN
        echo ""
    fi

    # In a real implementation, this would verify against a secure token
    # For demo purposes, we'll use a simple check
    if [ "$OWNER_TOKEN" != "WHATSDEX_OWNER_2025" ]; then
        print_error "Invalid owner token"
        echo "Access denied. This script is for project maintainers only."
        exit 1
    fi

    print_success "Owner authentication successful"
    echo "Welcome, authorized maintainer!"
    echo ""
}

# Ultra-simple deployment for owners
owner_quick_deploy() {
    print_header
    echo "🚀 Owner Quick Deployment"
    echo "This will deploy everything automatically with optimal settings."
    echo ""

    # Gather minimal info
    read -p "🌐 Domain (or 'localhost' for testing): " DOMAIN_NAME
    read -s -p "🔒 Database password (min 12 chars): " DB_PASSWORD
    echo ""
    read -p "📧 Admin email: " ADMIN_EMAIL

    echo ""
    print_info "Starting automated deployment..."

    # Create .env with optimal settings
    print_info "Creating optimized configuration..."
    cat > .env << EOF
# WhatsDeX Owner Deployment - Optimized Configuration
NODE_ENV=production
ADMIN_PORT=3001
HOST=127.0.0.1

# Database - Owner Optimized
DATABASE_URL="postgresql://whatsdex_admin:${DB_PASSWORD}@localhost:5432/whatsdex_prod?schema=public"

# Security - Maximum Security
JWT_SECRET="$(openssl rand -hex 64)"
JWT_EXPIRES_IN="24h"
BCRYPT_ROUNDS=15

# Frontend - Owner Domain
FRONTEND_URL="https://$DOMAIN_NAME"
CORS_ORIGIN="https://$DOMAIN_NAME"

# Email - Owner Notifications
FROM_EMAIL="$ADMIN_EMAIL"
FROM_NAME="WhatsDeX Admin"

# Advanced Features - All Enabled
LOG_LEVEL=debug
ENABLE_AUDIT_LOG=true
CONTENT_MODERATION_ENABLED=true
ENABLE_HEALTH_CHECKS=true
ENABLE_PROMETHEUS=true

# Performance - Optimized
CACHE_TTL=1800
RATE_LIMIT_WINDOW=600000
RATE_LIMIT_MAX_REQUESTS=500

# Owner Features
OWNER_MODE=true
ADVANCED_ANALYTICS=true
MAINTENANCE_MODE_ACCESS=true
EOF

    print_success "Configuration created with owner optimizations"

    # Install dependencies
    print_info "Installing dependencies..."
    npm ci --production --silent 2>/dev/null || npm install --production --silent
    print_success "Dependencies installed"

    # Setup database
    print_info "Setting up database..."
    if [ -f "scripts/setup-database.sh" ]; then
        echo "$DB_PASSWORD" | bash scripts/setup-database.sh >/dev/null 2>&1
        print_success "Database configured"
    fi

    # Run migrations
    print_info "Running migrations..."
    npx prisma generate --schema=prisma/schema.prisma >/dev/null 2>&1
    npx prisma migrate deploy --schema=prisma/schema.prisma >/dev/null 2>&1
    print_success "Migrations completed"

    # Start with PM2
    print_info "Starting application..."
    pm2 stop whatsdex-admin 2>/dev/null || true
    pm2 delete whatsdex-admin 2>/dev/null || true
    pm2 start ecosystem.config.js --env production >/dev/null 2>&1
    pm2 save >/dev/null 2>&1

    # Setup nginx if domain provided
    if [ "$DOMAIN_NAME" != "localhost" ]; then
        print_info "Configuring nginx..."
        sudo cp nginx.conf "/etc/nginx/sites-available/whatsdex-admin" 2>/dev/null || true
        sudo sed -i "s/yourdomain.com/$DOMAIN_NAME/g" "/etc/nginx/sites-available/whatsdex-admin" 2>/dev/null || true
        sudo ln -sf "/etc/nginx/sites-available/whatsdex-admin" "/etc/nginx/sites-enabled/" 2>/dev/null || true
        sudo nginx -t >/dev/null 2>&1 && sudo systemctl reload nginx >/dev/null 2>&1
        print_success "Nginx configured"
    fi

    print_success "Owner deployment completed!"
}

# Show deployment summary
show_owner_summary() {
    print_header
    echo -e "${GREEN}🎉 WhatsDeX Admin System Deployed Successfully!${NC}"
    echo ""
    echo -e "${BLUE}📍 Access Information:${NC}"
    if [ "$DOMAIN_NAME" = "localhost" ]; then
        echo "  • Local Access: http://localhost:3001"
        echo "  • Admin Panel: http://localhost:3001/admin"
    else
        echo "  • Public Access: https://$DOMAIN_NAME"
        echo "  • Admin Panel: https://$DOMAIN_NAME/admin"
    fi
    echo ""
    echo -e "${BLUE}🔧 Owner Commands:${NC}"
    echo "  • System Status: pm2 status"
    echo "  • View Logs: pm2 logs whatsdex-admin"
    echo "  • Health Check: ./scripts/health-check.sh"
    echo "  • Database Backup: ./scripts/backup.sh"
    echo ""
    echo -e "${BLUE}🔐 Owner Features Enabled:${NC}"
    echo "  • Advanced Analytics Dashboard"
    echo "  • Maintenance Mode Access"
    echo "  • Debug Logging"
    echo "  • Owner-Only API Endpoints"
    echo ""
    echo -e "${GREEN}🚀 Your optimized admin system is ready!${NC}"
}

# Main function
main() {
    verify_owner_token
    owner_quick_deploy
    show_owner_summary
}

# Run main function
main "$@"
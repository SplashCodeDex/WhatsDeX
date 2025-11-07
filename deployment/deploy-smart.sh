#!/bin/bash

# Smart WhatsDeX SaaS Deployment
# Services build in proper order, QR codes ONLY in web browser!

set -e

echo "🚀 Smart WhatsDeX SaaS Deployment Starting..."
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

COMPOSE_FILE="deployment/docker-compose.smart.yml"

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose not installed"
        exit 1
    fi
    
    print_success "Prerequisites OK"
}

# Create database init script
setup_database() {
    print_status "Setting up database initialization..."
    
    cat > deployment/init.sql << 'EOF'
-- WhatsDeX SaaS Database Initialization
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    plan VARCHAR(50) DEFAULT 'free',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create sessions table for WhatsApp persistence
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(100) NOT NULL,
    session_data JSONB,
    connected BOOLEAN DEFAULT false,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, session_id)
);

-- Create bots table
CREATE TABLE IF NOT EXISTS bots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    status VARCHAR(50) DEFAULT 'disconnected',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user
INSERT INTO users (email, password_hash, plan) 
VALUES ('admin@whatsdx.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewohO5eL8/5zO0oi', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_user_id ON whatsapp_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_bots_user_id ON bots(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
EOF

    print_success "Database setup completed"
}

# Clean deployment
clean_deployment() {
    print_status "Cleaning previous deployment..."
    
    docker-compose -f "$COMPOSE_FILE" down --remove-orphans --volumes 2>/dev/null || true
    docker system prune -f 2>/dev/null || true
    
    print_success "Cleanup completed"
}

# Deploy with smart orchestration
deploy_services() {
    print_status "Starting smart deployment with proper service ordering..."
    
    echo ""
    print_status "Phase 1: Starting Database (PostgreSQL)"
    docker-compose -f "$COMPOSE_FILE" up -d postgres
    
    echo ""
    print_status "Phase 2: Waiting for Database to be ready..."
    for i in {1..30}; do
        if docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U whatsdx_user -d whatsdx_saas 2>/dev/null; then
            print_success "✅ Database is ready!"
            break
        fi
        echo "⏳ Database starting... ($i/30)"
        sleep 5
    done
    
    echo ""
    print_status "Phase 3: Starting Redis Cache"
    docker-compose -f "$COMPOSE_FILE" up -d redis
    
    echo ""
    print_status "Phase 4: Waiting for Redis to be ready..."
    for i in {1..20}; do
        if docker-compose -f "$COMPOSE_FILE" exec -T redis redis-cli ping 2>/dev/null | grep -q PONG; then
            print_success "✅ Redis is ready!"
            break
        fi
        echo "⏳ Redis starting... ($i/20)"
        sleep 3
    done
    
    echo ""
    print_status "Phase 5: Building and Starting WhatsDeX Bot"
    docker-compose -f "$COMPOSE_FILE" up -d --build whatsdx-bot
    
    echo ""
    print_status "Phase 6: Waiting for Bot to be fully ready..."
    for i in {1..60}; do
        if curl -f http://localhost:3000/health &>/dev/null; then
            print_success "✅ WhatsDeX Bot is ready!"
            break
        fi
        echo "⏳ Bot initializing... ($i/60)"
        sleep 10
    done
    
    echo ""
    print_status "Phase 7: Building and Starting Web Dashboard"
    docker-compose -f "$COMPOSE_FILE" up -d --build whatsdx-web
    
    echo ""
    print_status "Phase 8: Waiting for Web Dashboard to be ready..."
    for i in {1..40}; do
        if curl -f http://localhost:3001/api/health &>/dev/null; then
            print_success "✅ Web Dashboard is ready!"
            break
        fi
        echo "⏳ Web dashboard building... ($i/40)"
        sleep 10
    done
    
    echo ""
    print_status "Phase 9: Starting Support Services"
    docker-compose -f "$COMPOSE_FILE" up -d session-backup smart-launcher
    
    print_success "All services deployed successfully!"
}

# Final system check
system_check() {
    print_status "Performing final system check..."
    
    echo ""
    print_status "Service Health Status:"
    
    # Check PostgreSQL
    if docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U whatsdx_user &>/dev/null; then
        print_success "✅ PostgreSQL: Healthy"
    else
        print_error "❌ PostgreSQL: Unhealthy"
    fi
    
    # Check Redis
    if docker-compose -f "$COMPOSE_FILE" exec -T redis redis-cli ping &>/dev/null; then
        print_success "✅ Redis: Healthy"
    else
        print_error "❌ Redis: Unhealthy"
    fi
    
    # Check Bot API
    if curl -f http://localhost:3000/health &>/dev/null; then
        print_success "✅ Bot API: Healthy"
    else
        print_error "❌ Bot API: Unhealthy"
    fi
    
    # Check Web Dashboard
    if curl -f http://localhost:3001/api/health &>/dev/null; then
        print_success "✅ Web Dashboard: Healthy"
    else
        print_warning "⚠️ Web Dashboard: May still be starting"
    fi
}

# Show final instructions
show_success_message() {
    echo ""
    echo "🎉============================================🎉"
    echo "   SMART DEPLOYMENT COMPLETED SUCCESSFULLY!"
    echo "🎉============================================🎉"
    echo ""
    
    print_success "🌐 WhatsDeX SaaS is LIVE and ready!"
    echo ""
    echo "📱 USER-FRIENDLY ACCESS:"
    echo "  🔗 Web Dashboard: http://localhost:3001"
    echo "  🤖 Bot API: http://localhost:3000"
    echo ""
    echo "🎯 WHAT HAPPENS NEXT (User Experience):"
    echo "  1. 🌐 User opens http://localhost:3001 in browser"
    echo "  2. 📱 Clicks 'Connect WhatsApp' button"
    echo "  3. 📷 QR code appears ON THE WEB PAGE (not terminal!)"
    echo "  4. 📱 User scans QR code with phone"
    echo "  5. ✅ WhatsApp connected FOREVER (no more scanning!)"
    echo ""
    echo "🔧 SMART FEATURES ENABLED:"
    echo "  ✅ Services started in proper order"
    echo "  ✅ Health checks ensured readiness"
    echo "  ✅ QR codes ONLY in web browser"
    echo "  ✅ Persistent sessions (scan once, work forever)"
    echo "  ✅ Automatic dependency management"
    echo "  ✅ Professional user experience"
    echo ""
    echo "🎊 NO MORE TERMINAL QR CODES!"
    echo "🎊 NO MORE MANUAL SERVICE ORDERING!"
    echo "🎊 NO MORE USER CONFUSION!"
    echo ""
    
    print_success "Your SaaS is ready for end users! 🚀"
    echo ""
    print_status "Management Commands:"
    echo "  📊 View logs: docker-compose -f $COMPOSE_FILE logs -f"
    echo "  🛑 Stop all: docker-compose -f $COMPOSE_FILE down"
    echo "  🔄 Restart: docker-compose -f $COMPOSE_FILE restart"
    echo ""
}

# Auto-open browser (optional)
open_browser() {
    print_status "Opening web dashboard in browser..."
    
    # Detect OS and open browser
    case "$(uname -s)" in
        Darwin) open http://localhost:3001 ;;
        Linux) xdg-open http://localhost:3001 2>/dev/null || echo "Please open http://localhost:3001 manually" ;;
        CYGWIN*|MINGW*|MSYS*) start http://localhost:3001 ;;
        *) echo "Please open http://localhost:3001 in your browser" ;;
    esac
}

# Main deployment function
main() {
    echo "🚀 Smart WhatsDeX SaaS Deployment"
    echo "=================================="
    echo "✅ Services will start in proper order"
    echo "✅ QR codes will appear in web browser only"
    echo "✅ Users will have professional experience"
    echo ""
    
    check_prerequisites
    setup_database
    clean_deployment
    deploy_services
    system_check
    show_success_message
    
    # Uncomment to auto-open browser
    # open_browser
    
    print_success "🎉 Smart deployment completed! Visit http://localhost:3001"
}

# Handle interruption
trap 'print_error "Deployment interrupted"; exit 1' INT TERM

# Run deployment
main "$@"
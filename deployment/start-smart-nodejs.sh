#!/bin/bash

# Smart WhatsDeX Node.js Deployment
# Services start in proper order, QR codes ONLY in web browser!

set -e

echo "🚀 Smart WhatsDeX Node.js Deployment Starting..."
echo "================================================="

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

# Clean any existing processes
cleanup_processes() {
    print_status "Cleaning up existing processes..."
    pkill -f "npm start" 2>/dev/null || true
    pkill -f "node ." 2>/dev/null || true
    pkill -f "node index.js" 2>/dev/null || true
    sleep 3
    print_success "Cleanup completed"
}

# Setup environment
setup_environment() {
    print_status "Setting up environment..."
    
    # Ensure directories exist
    mkdir -p {sessions,uploads,backups,logs}
    
    # Copy production environment
    if [ -f ".env.production.complete" ]; then
        cp .env.production.complete .env
        print_success "Production environment loaded"
    else
        print_warning "Using default environment"
    fi
    
    # Generate Prisma client
    npm run generate
    print_success "Prisma client generated"
}

# Start bot with smart configuration
start_smart_bot() {
    print_status "Starting WhatsDeX with smart SaaS configuration..."
    
    # Set environment variables for smart behavior
    export NODE_ENV=production
    export PORT=3000
    export PERSIST_SESSIONS=true
    export WEB_QR_ENABLED=true
    export PRINT_QR_IN_TERMINAL=false
    export AUTO_OPEN_BROWSER=false
    export HEADLESS=true
    export SESSION_PATH="./sessions"
    export BACKUP_ENABLED=true
    
    # Start bot in background
    npm run start:saas &
    BOT_PID=$!
    
    print_status "Bot started with PID: $BOT_PID"
    echo $BOT_PID > .bot.pid
    
    # Wait for bot to be ready
    print_status "Waiting for bot to initialize..."
    for i in {1..60}; do
        if curl -f http://localhost:3000/health &>/dev/null; then
            print_success "✅ Bot is ready and healthy!"
            break
        fi
        echo "⏳ Bot initializing... ($i/60)"
        sleep 5
    done
}

# Start web dashboard
start_web_dashboard() {
    print_status "Starting web dashboard..."
    
    cd web
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_status "Installing web dependencies..."
        npm install
    fi
    
    # Set environment for web
    export NODE_ENV=production
    export NEXT_PUBLIC_API_URL=http://localhost:3000
    export NEXT_PUBLIC_AUTO_SHOW_QR=true
    export PORT=3001
    
    # Start web dashboard
    npm start &
    WEB_PID=$!
    
    print_status "Web dashboard started with PID: $WEB_PID"
    echo $WEB_PID > ../.web.pid
    
    cd ..
    
    # Wait for web to be ready
    print_status "Waiting for web dashboard to be ready..."
    for i in {1..40}; do
        if curl -f http://localhost:3001 &>/dev/null; then
            print_success "✅ Web dashboard is ready!"
            break
        fi
        echo "⏳ Web dashboard starting... ($i/40)"
        sleep 10
    done
}

# Final health check
final_health_check() {
    print_status "Performing final health check..."
    
    echo ""
    print_status "Service Status:"
    
    # Check Bot API
    if curl -f http://localhost:3000/health &>/dev/null; then
        print_success "✅ Bot API (http://localhost:3000): Healthy"
    else
        print_error "❌ Bot API: Unhealthy"
        return 1
    fi
    
    # Check Web Dashboard
    if curl -f http://localhost:3001 &>/dev/null; then
        print_success "✅ Web Dashboard (http://localhost:3001): Healthy"
    else
        print_warning "⚠️ Web Dashboard: May still be building"
    fi
    
    print_success "Health check completed"
}

# Show success message
show_success_message() {
    echo ""
    echo "🎉============================================🎉"
    echo "   SMART NODE.JS DEPLOYMENT SUCCESSFUL!"
    echo "🎉============================================🎉"
    echo ""
    
    print_success "🌐 WhatsDeX SaaS is LIVE!"
    echo ""
    echo "📱 USER EXPERIENCE:"
    echo "  🔗 Web Dashboard: http://localhost:3001"
    echo "  🤖 Bot API: http://localhost:3000"
    echo "  📊 Health Check: http://localhost:3000/health"
    echo ""
    echo "🎯 WHAT USERS SEE:"
    echo "  1. 🌐 Open http://localhost:3001 in browser"
    echo "  2. 📱 Click 'Connect WhatsApp'"
    echo "  3. 📷 QR code appears IN THE BROWSER (not terminal!)"
    echo "  4. 📱 Scan QR code with phone"
    echo "  5. ✅ WhatsApp connected FOREVER!"
    echo ""
    echo "🔧 SMART FEATURES ACTIVE:"
    echo "  ✅ No QR codes in terminal"
    echo "  ✅ Persistent sessions (./sessions/)"
    echo "  ✅ Auto-reconnection on restart"
    echo "  ✅ Professional web interface"
    echo "  ✅ Real-time status updates"
    echo ""
    echo "🎊 NO MORE TERMINAL ACCESS NEEDED!"
    echo "🎊 PERFECT FOR NOVICE USERS!"
    echo ""
    
    print_success "Your SaaS is ready! Open http://localhost:3001 🚀"
    echo ""
    print_status "Management:"
    echo "  📊 Stop services: pkill -f 'npm start'"
    echo "  🔄 Restart: ./deployment/start-smart-nodejs.sh"
    echo "  📋 View processes: ps aux | grep npm"
}

# Auto-open browser (optional)
open_browser() {
    print_status "Opening web dashboard..."
    sleep 2
    
    case "$(uname -s)" in
        Darwin) open http://localhost:3001 ;;
        Linux) 
            if command -v xdg-open >/dev/null; then
                xdg-open http://localhost:3001
            else
                print_status "Please open http://localhost:3001 in your browser"
            fi
            ;;
        *) print_status "Please open http://localhost:3001 in your browser" ;;
    esac
}

# Main deployment function
main() {
    echo "🚀 Smart WhatsDeX Node.js Deployment"
    echo "====================================="
    echo "✅ Bot will start with no terminal QR codes"
    echo "✅ Web dashboard will show QR codes"
    echo "✅ Sessions will persist across restarts"
    echo "✅ Perfect for end users!"
    echo ""
    
    cleanup_processes
    setup_environment
    start_smart_bot
    start_web_dashboard
    final_health_check
    show_success_message
    
    # Auto-open browser (uncomment if desired)
    # open_browser
    
    print_success "🎉 Deployment complete! Visit http://localhost:3001"
}

# Handle interruption
trap 'print_error "Deployment interrupted"; pkill -f "npm start"; exit 1' INT TERM

# Run deployment
main "$@"
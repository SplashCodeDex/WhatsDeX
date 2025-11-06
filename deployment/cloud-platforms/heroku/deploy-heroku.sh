#!/bin/bash

# WhatsDeX AI Bot - Heroku Deployment Script
# Deploy to Heroku with full configuration

set -e

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[HEROKU]${NC} $1"
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

# Configuration
APP_NAME=${1:-"whatsdx-ai-bot"}
ENVIRONMENT=${2:-"production"}
REGION=${3:-"us"}

print_status "Starting Heroku deployment for WhatsDeX AI Bot"
print_status "App Name: $APP_NAME"
print_status "Environment: $ENVIRONMENT"
print_status "Region: $REGION"

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Heroku CLI
    if ! command -v heroku &> /dev/null; then
        print_error "Heroku CLI not found. Please install it first:"
        echo "https://devcenter.heroku.com/articles/heroku-cli"
        exit 1
    fi
    
    # Check if logged in
    if ! heroku auth:whoami &> /dev/null; then
        print_status "Please log in to Heroku"
        heroku login
    fi
    
    # Check Git
    if ! command -v git &> /dev/null; then
        print_error "Git is required for Heroku deployment"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Setup Heroku app
setup_heroku_app() {
    print_status "Setting up Heroku application..."
    
    # Create app if it doesn't exist
    if ! heroku apps:info $APP_NAME &> /dev/null; then
        print_status "Creating Heroku app: $APP_NAME"
        heroku create $APP_NAME --region $REGION
    else
        print_status "Using existing app: $APP_NAME"
    fi
    
    # Add git remote if not exists
    if ! git remote get-url heroku &> /dev/null; then
        heroku git:remote -a $APP_NAME
    fi
    
    print_success "Heroku app setup completed"
}

# Setup addons
setup_addons() {
    print_status "Setting up Heroku addons..."
    
    # PostgreSQL
    if ! heroku addons --app $APP_NAME | grep -q "heroku-postgresql"; then
        print_status "Adding PostgreSQL addon..."
        heroku addons:create heroku-postgresql:basic --app $APP_NAME
    fi
    
    # Redis
    if ! heroku addons --app $APP_NAME | grep -q "heroku-redis"; then
        print_status "Adding Redis addon..."
        heroku addons:create heroku-redis:basic --app $APP_NAME
    fi
    
    # Papertrail for logging
    if ! heroku addons --app $APP_NAME | grep -q "papertrail"; then
        print_status "Adding Papertrail logging..."
        heroku addons:create papertrail:choklad --app $APP_NAME
    fi
    
    # New Relic for monitoring
    if ! heroku addons --app $APP_NAME | grep -q "newrelic"; then
        print_status "Adding New Relic monitoring..."
        heroku addons:create newrelic:wayne --app $APP_NAME
    fi
    
    print_success "Heroku addons setup completed"
}

# Configure environment variables
configure_env_vars() {
    print_status "Configuring environment variables..."
    
    # Core environment variables
    heroku config:set NODE_ENV=production --app $APP_NAME
    heroku config:set AI_INTELLIGENCE_MODE=true --app $APP_NAME
    heroku config:set ANALYTICS_ENABLED=true --app $APP_NAME
    heroku config:set HEROKU_DEPLOYMENT=true --app $APP_NAME
    heroku config:set LOG_LEVEL=info --app $APP_NAME
    heroku config:set BOT_NAME="WhatsDeX AI Assistant" --app $APP_NAME
    
    # Generate JWT secrets if not set
    if ! heroku config:get JWT_SECRET --app $APP_NAME &> /dev/null; then
        JWT_SECRET=$(openssl rand -base64 32)
        heroku config:set JWT_SECRET="$JWT_SECRET" --app $APP_NAME
    fi
    
    if ! heroku config:get NEXTAUTH_SECRET --app $APP_NAME &> /dev/null; then
        NEXTAUTH_SECRET=$(openssl rand -base64 32)
        heroku config:set NEXTAUTH_SECRET="$NEXTAUTH_SECRET" --app $APP_NAME
    fi
    
    print_success "Basic environment variables configured"
    
    # Prompt for required API keys
    print_warning "Please set the following environment variables manually:"
    echo "heroku config:set GEMINI_API_KEY=your_gemini_key --app $APP_NAME"
    echo "heroku config:set OPENAI_API_KEY=your_openai_key --app $APP_NAME"
    echo "heroku config:set YOUTUBE_API_KEY=your_youtube_key --app $APP_NAME"
    echo "heroku config:set WEATHER_API_KEY=your_weather_key --app $APP_NAME"
}

# Setup Heroku configuration files
setup_heroku_config() {
    print_status "Setting up Heroku configuration files..."
    
    # Copy Heroku files to root
    cp deployment/cloud-platforms/heroku/Procfile ./Procfile
    cp deployment/cloud-platforms/heroku/app.json ./app.json
    
    # Create Heroku-specific scripts in package.json
    npm pkg set scripts.heroku:start="node main.js"
    npm pkg set scripts.heroku:worker="node src/worker.js"
    npm pkg set scripts.heroku:release="npm run generate && npm run migrate"
    npm pkg set scripts.heroku:setup="npm run generate"
    npm pkg set scripts.heroku:scheduler="node scripts/scheduler.js"
    npm pkg set engines.node=">=18.0.0"
    npm pkg set engines.npm=">=8.0.0"
    
    # Create Heroku-specific start script
    cat > heroku-start.js << 'EOF'
// Heroku start script for WhatsDeX AI Bot
const { spawn } = require('child_process');

console.log('🚀 Starting WhatsDeX AI Bot on Heroku...');

// Environment validation
const requiredEnvs = ['DATABASE_URL', 'REDIS_URL'];
for (const env of requiredEnvs) {
    if (!process.env[env]) {
        console.error(`❌ Required environment variable ${env} not set`);
        process.exit(1);
    }
}

console.log('✅ Environment validation passed');

// Start main application
const mainProcess = spawn('node', ['main.js'], {
    stdio: 'inherit',
    env: {
        ...process.env,
        PORT: process.env.PORT || 3000,
        NODE_ENV: 'production',
        HEROKU_DEPLOYMENT: 'true'
    }
});

// Handle process events
mainProcess.on('exit', (code) => {
    console.log(`Main process exited with code ${code}`);
    if (code !== 0) {
        process.exit(code);
    }
});

// Graceful shutdown
const shutdown = (signal) => {
    console.log(`🛑 Received ${signal}, shutting down gracefully...`);
    mainProcess.kill(signal);
    setTimeout(() => {
        console.log('🔪 Forcing shutdown...');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Keep alive for Heroku
setInterval(() => {
    console.log('💓 Heartbeat - keeping process alive');
}, 300000); // 5 minutes
EOF
    
    print_success "Heroku configuration setup completed"
}

# Deploy to Heroku
deploy_to_heroku() {
    print_status "Deploying to Heroku..."
    
    # Add files to git
    git add Procfile app.json heroku-start.js package.json
    git commit -m "Add Heroku deployment configuration" || true
    
    # Deploy to Heroku
    print_status "Pushing to Heroku..."
    git push heroku main || git push heroku master
    
    # Scale dynos
    print_status "Scaling dynos..."
    heroku ps:scale web=1 worker=1 --app $APP_NAME
    
    print_success "Heroku deployment completed!"
}

# Post-deployment setup
post_deployment_setup() {
    print_status "Running post-deployment setup..."
    
    # Run database migrations
    print_status "Running database migrations..."
    heroku run npm run migrate --app $APP_NAME
    
    # Check app status
    print_status "Checking application status..."
    heroku ps --app $APP_NAME
    
    # Get app URL
    APP_URL=$(heroku apps:info $APP_NAME --json | grep -o '"web_url":"[^"]*' | cut -d'"' -f4)
    
    print_success "Post-deployment setup completed!"
    
    # Display deployment information
    echo ""
    print_status "🎉 Deployment Summary:"
    echo "  - App Name: $APP_NAME"
    echo "  - App URL: $APP_URL"
    echo "  - Health Check: ${APP_URL}api/health"
    echo "  - Dashboard: ${APP_URL}analytics-dashboard"
    echo ""
    
    print_status "📊 Useful Heroku Commands:"
    echo "  - View logs: heroku logs --tail --app $APP_NAME"
    echo "  - Scale web: heroku ps:scale web=2 --app $APP_NAME"
    echo "  - Scale worker: heroku ps:scale worker=2 --app $APP_NAME"
    echo "  - Open app: heroku open --app $APP_NAME"
    echo "  - SSH access: heroku run bash --app $APP_NAME"
    echo ""
}

# Cleanup
cleanup() {
    print_status "Cleaning up temporary files..."
    
    # Remove temporary files
    rm -f heroku-start.js
    
    print_success "Cleanup completed"
}

# Main execution
main() {
    check_prerequisites
    setup_heroku_app
    setup_addons
    configure_env_vars
    setup_heroku_config
    deploy_to_heroku
    post_deployment_setup
    cleanup
    
    print_success "Heroku deployment completed successfully! 🚀"
    
    echo ""
    print_status "🔗 Next Steps:"
    echo "1. Set required API keys using the commands shown above"
    echo "2. Test the deployment: heroku open --app $APP_NAME"
    echo "3. Monitor logs: heroku logs --tail --app $APP_NAME"
    echo "4. Configure domain: heroku domains:add yourdomain.com --app $APP_NAME"
    echo ""
}

# Error handling
trap 'print_error "Heroku deployment failed at line $LINENO"' ERR

# Show help
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    echo "Heroku Deployment Script for WhatsDeX AI Bot"
    echo ""
    echo "Usage: $0 [APP_NAME] [ENVIRONMENT] [REGION]"
    echo ""
    echo "Arguments:"
    echo "  APP_NAME    - Heroku app name (default: whatsdx-ai-bot)"
    echo "  ENVIRONMENT - Deployment environment (default: production)"
    echo "  REGION      - Heroku region (default: us)"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Use defaults"
    echo "  $0 my-whatsdx-bot production eu       # Custom settings"
    echo ""
    exit 0
fi

# Run main function
main "$@"
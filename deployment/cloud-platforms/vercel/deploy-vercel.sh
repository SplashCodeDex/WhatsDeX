#!/bin/bash

# WhatsDeX AI Bot - Vercel Deployment Script
# Deploy to Vercel with optimized configuration

set -e

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[VERCEL]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Configuration
PROJECT_NAME="whatsdx-ai-bot"
ENVIRONMENT=${1:-"production"}

print_status "Starting Vercel deployment for WhatsDeX AI Bot"
print_status "Environment: $ENVIRONMENT"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    print_warning "Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if already logged in
if ! vercel whoami &> /dev/null; then
    print_status "Please log in to Vercel"
    vercel login
fi

# Prepare environment variables
print_status "Setting up environment variables for Vercel..."

# Core environment variables for Vercel
VERCEL_ENVS=(
    "NODE_ENV=production"
    "AI_INTELLIGENCE_MODE=true"
    "ANALYTICS_ENABLED=true"
    "VERCEL_DEPLOYMENT=true"
)

# Add environment variables to Vercel
for env_var in "${VERCEL_ENVS[@]}"; do
    IFS='=' read -r key value <<< "$env_var"
    vercel env add "$key" "$value" production --force || true
done

print_status "Setting sensitive environment variables (will prompt)..."

# Sensitive variables that need to be set manually
SENSITIVE_VARS=(
    "GEMINI_API_KEY"
    "POSTGRES_PASSWORD"
    "REDIS_PASSWORD"
    "JWT_SECRET"
    "NEXTAUTH_SECRET"
    "DATABASE_URL"
)

for var in "${SENSITIVE_VARS[@]}"; do
    print_warning "Please set $var in Vercel dashboard or use: vercel env add $var"
done

# Copy Vercel configuration
print_status "Setting up Vercel configuration..."
cp deployment/cloud-platforms/vercel/vercel.json ./vercel.json

# Create Vercel-optimized package.json
print_status "Optimizing package.json for Vercel..."
cat > vercel-package.json << 'EOF'
{
  "name": "whatsdx-ai-bot-vercel",
  "version": "2.0.0",
  "description": "WhatsDeX AI Bot - Vercel Deployment",
  "main": "main.js",
  "scripts": {
    "build": "npm run generate && npm run build:web",
    "build:web": "cd web && npm install && npm run build",
    "generate": "npx prisma generate",
    "start": "node main.js",
    "vercel-build": "npm run generate && cd web && npm install && npm run build"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "@whiskeysockets/baileys": "^6.4.0",
    "@hapi/boom": "^10.0.1",
    "qrcode-terminal": "^0.12.0",
    "@prisma/client": "^5.0.0",
    "prisma": "^5.0.0",
    "pino": "^8.14.1",
    "bullmq": "^4.2.0",
    "ioredis": "^5.3.2",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "rate-limiter-flexible": "^3.0.0",
    "jsonwebtoken": "^9.0.1",
    "bcryptjs": "^2.4.3",
    "axios": "^1.4.0",
    "dotenv": "^16.1.4"
  }
}
EOF

# Deploy to Vercel
print_status "Deploying to Vercel..."

case $ENVIRONMENT in
    "production")
        vercel --prod --yes
        ;;
    "preview")
        vercel --yes
        ;;
    *)
        vercel --yes
        ;;
esac

# Get deployment URL
DEPLOYMENT_URL=$(vercel ls | grep "$PROJECT_NAME" | head -1 | awk '{print $2}')

print_success "Deployment completed!"
print_status "Deployment URL: https://$DEPLOYMENT_URL"

# Setup custom domain (optional)
print_status "To setup custom domain, run:"
echo "vercel domains add yourdomain.com"
echo "vercel alias https://$DEPLOYMENT_URL yourdomain.com"

# Cleanup
rm -f vercel-package.json vercel.json

print_success "Vercel deployment script completed!"

# Display post-deployment checklist
echo ""
print_status "Post-deployment checklist:"
echo "1. ✅ Verify environment variables in Vercel dashboard"
echo "2. ✅ Test API endpoints: https://$DEPLOYMENT_URL/api/health"
echo "3. ✅ Test dashboard: https://$DEPLOYMENT_URL/analytics-dashboard"
echo "4. ✅ Setup custom domain if needed"
echo "5. ✅ Configure webhooks for WhatsApp"
echo "6. ✅ Monitor deployment logs: vercel logs"
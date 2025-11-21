# WhatsDeX Deployment Script (PowerShell)
# Automates the deployment process for Backend and Frontend

Write-Host "🚀 Starting WhatsDeX Deployment..." -ForegroundColor Cyan

# 1. Pull latest changes
Write-Host "📥 Pulling latest changes from git..." -ForegroundColor Yellow
git pull origin main

# 2. Backend Setup
Write-Host "🔧 Setting up Backend..." -ForegroundColor Yellow
Set-Location backend
Write-Host "   📦 Installing backend dependencies..." -ForegroundColor Gray
npm ci --only=production
Write-Host "   🗄️  Running database migrations..." -ForegroundColor Gray
npx prisma generate
npx prisma migrate deploy
Set-Location ..

# 3. Frontend Setup
Write-Host "🎨 Setting up Frontend..." -ForegroundColor Yellow
Set-Location frontend
Write-Host "   📦 Installing frontend dependencies..." -ForegroundColor Gray
npm ci --only=production
Write-Host "   🏗️  Building frontend..." -ForegroundColor Gray
npm run build
Set-Location ..

# 4. Restart Services
Write-Host "🔄 Restarting PM2 services..." -ForegroundColor Yellow
Set-Location backend
pm2 restart ecosystem.config.js --env production

Write-Host "✅ Deployment Complete!" -ForegroundColor Green

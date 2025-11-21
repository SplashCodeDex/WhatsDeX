#!/bin/bash

# WhatsDeX Deployment Script
# Automates the deployment process for Backend and Frontend

echo "🚀 Starting WhatsDeX Deployment..."

# 1. Pull latest changes
echo "📥 Pulling latest changes from git..."
git pull origin main

# 2. Backend Setup
echo "🔧 Setting up Backend..."
cd backend
echo "   📦 Installing backend dependencies..."
npm ci --only=production
echo "   🗄️  Running database migrations..."
npx prisma generate
npx prisma migrate deploy
cd ..

# 3. Frontend Setup
echo "🎨 Setting up Frontend..."
cd frontend
echo "   📦 Installing frontend dependencies..."
npm ci --only=production
echo "   🏗️  Building frontend..."
npm run build
cd ..

# 4. Restart Services
echo "🔄 Restarting PM2 services..."
cd backend
pm2 restart ecosystem.config.js --env production

echo "✅ Deployment Complete!"

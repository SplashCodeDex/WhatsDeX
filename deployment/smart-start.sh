#!/bin/sh

echo "🚀 Starting WhatsDeX Smart Deployment..."

# Wait for database
echo "⏳ Waiting for database connection..."
while ! nc -z postgres 5432; do
  echo "Waiting for PostgreSQL..."
  sleep 3
done
echo "✅ Database connected!"

# Wait for Redis
echo "⏳ Waiting for Redis connection..."
while ! nc -z redis 6379; do
  echo "Waiting for Redis..."
  sleep 2
done
echo "✅ Redis connected!"

# Run database migrations
echo "📊 Running database migrations..."
npm run migrate

# Set environment variables for smart deployment
export HEADLESS_QR=true          # Don't show QR in terminal
export WEB_QR_ENABLED=true       # Enable web QR display
export PERSIST_SESSIONS=true     # Enable session persistence
export AUTO_RECONNECT=true       # Auto-reconnect on startup

echo "🎯 Starting WhatsDeX with web QR mode..."
echo "📱 QR codes will be displayed in web dashboard at http://localhost:3001"
echo "🚫 Terminal QR display: DISABLED (user-friendly mode)"

# Start the application
npm start
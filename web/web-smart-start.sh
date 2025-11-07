#!/bin/sh

echo "🌐 Starting WhatsDeX Web Dashboard..."

# Wait for bot API to be ready
echo "⏳ Waiting for Bot API to be ready..."
while ! curl -f http://whatsdx-bot:3000/health 2>/dev/null; do
  echo "Waiting for Bot API at http://whatsdx-bot:3000..."
  sleep 5
done
echo "✅ Bot API is ready!"

# Ensure environment is set for smart mode
export NODE_ENV=production
export NEXT_PUBLIC_SMART_MODE=true
export NEXT_PUBLIC_QR_DISPLAY=true
export NEXT_PUBLIC_API_URL=http://localhost:3000

echo "🎯 Starting Web Dashboard in smart mode..."
echo "📱 QR codes will be displayed in browser interface"
echo "🌐 Dashboard will be available at http://localhost:3001"

# Start the web application
npm start
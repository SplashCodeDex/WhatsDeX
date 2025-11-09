# 🚀 WhatsDeX Complete Startup Guide

## Prerequisites Checklist

### ✅ **Required Software:**
- [x] Node.js 18+ installed
- [x] PostgreSQL 17 running (localhost:5432)
- [x] Redis Cloud or local Redis (port 6379)
- [x] Git (for cloning)

### ✅ **Environment Setup:**
- [x] `.env` file configured with all required variables
- [x] `web/.env.local` file configured
- [x] All dependencies installed (`npm install`)
- [x] All infrastructure fixes applied

## 🎯 **Quick Start (3 Commands)**

```bash
# 1. Start all services with automated launcher
node start-whatsdx.js

# 2. Or manual step-by-step (if you prefer control)
npm start &                    # Start bot service
cd web && npm run dev &        # Start web dashboard

# 3. Access the services
# Bot QR Code: http://localhost:3000/qr
# Web Dashboard: http://localhost:3000
# API Health: http://localhost:3001/health
```

## 📋 **Detailed Step-by-Step Process**

### Step 1: Environment Verification
```bash
# Check if all required services are ready
node validate_fixes.js
```

### Step 2: Database Initialization
```bash
# Initialize Prisma database
npx prisma generate
npx prisma db push
```

### Step 3: Service Startup
```bash
# Option A: Automated (Recommended)
node start-whatsdx.js

# Option B: Manual Control
npm start                      # Terminal 1: Bot service
cd web && npm run dev         # Terminal 2: Web dashboard
```

### Step 4: WhatsApp Connection
1. **Visit:** http://localhost:3000/qr
2. **Scan** the QR code with WhatsApp
3. **Wait** for "Connected!" message

### Step 5: Verification
```bash
# Check all services are healthy
curl http://localhost:3001/health
curl http://localhost:3000/api/health
```

## 🔧 **Service Ports & URLs**

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| **Bot API** | 3001 | http://localhost:3001 | Main bot service |
| **Web Dashboard** | 3000 | http://localhost:3000 | Admin interface |
| **QR Code Page** | 3000 | http://localhost:3000/qr | WhatsApp pairing |
| **Health Check** | 3001 | http://localhost:3001/health | System status |
| **Metrics** | 3001 | http://localhost:3001/health/metrics | Performance data |

## 🗄️ **Database & Redis**

### PostgreSQL Configuration:
- **Host:** localhost:5432
- **Database:** whatsdex
- **User:** CodeDeX
- **Password:** admin

### Redis Configuration:
- **Host:** Your Redis Cloud URL (from .env)
- **Purpose:** Rate limiting, session management

## 🚨 **Troubleshooting Common Issues**

### Issue: "Port already in use"
```bash
# Kill processes on specific ports
npx kill-port 3000 3001
# Or find and kill manually
lsof -ti:3000 | xargs kill -9
```

### Issue: "Database connection failed"
```bash
# Check PostgreSQL status
pg_ctl status -D "C:\Program Files\PostgreSQL\17\data"

# Restart PostgreSQL
pg_ctl restart -D "C:\Program Files\PostgreSQL\17\data"
```

### Issue: "Redis connection failed"
```bash
# Check Redis Cloud URL in .env
echo $REDIS_URL
# Test Redis connection
redis-cli -u $REDIS_URL ping
```

### Issue: "Module not found"
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# For web dashboard
cd web
rm -rf node_modules package-lock.json
npm install
```

## 📱 **WhatsApp Bot Usage**

### First-Time Setup:
1. **QR Scan:** Visit http://localhost:3000/qr
2. **Test Command:** Send `.ping` to your bot
3. **Admin Commands:** Send `.menu` for command list

### Available Commands:
- **AI Chat:** `.gemini <question>`
- **Info:** `.ping`, `.uptime`, `.help`
- **Admin:** `.stats`, `.health`, `.users`

## 🔒 **Security Notes**

### Production Deployment:
- [ ] Change all default passwords in `.env`
- [ ] Use strong JWT secrets (64+ characters)
- [ ] Enable HTTPS for web dashboard
- [ ] Configure firewall rules
- [ ] Set up proper logging

### API Keys Required:
- [ ] Google Gemini API key
- [ ] OpenAI API key (optional)
- [ ] Stripe keys (for premium features)

## 📊 **Monitoring & Logs**

### Real-time Monitoring:
```bash
# View bot logs
tail -f logs/combined.log

# View web dashboard logs
cd web && npm run dev

# System health dashboard
curl http://localhost:3001/health/info
```

### Log Files Location:
- **Bot Logs:** `./logs/`
- **Error Logs:** `./logs/error.log`
- **Access Logs:** `./logs/combined.log`
- **Performance:** `./logs/app-events.log`

## 🆘 **Emergency Commands**

```bash
# Stop all services immediately
pkill -f "node.*whatsdx"
pkill -f "npm.*dev"

# Reset everything (nuclear option)
npm run reset-all   # If this script exists
# Or manually:
rm -rf node_modules web/node_modules
rm -rf logs sessions
npm install && cd web && npm install
```

## ✅ **Success Indicators**

You know everything is working when you see:
- [ ] `✅ Database connected successfully`
- [ ] `✅ Redis connection ready` 
- [ ] `🤖 Bot Service: RUNNING`
- [ ] `🌐 Web Dashboard: Ready on http://localhost:3000`
- [ ] WhatsApp QR code displays properly
- [ ] Bot responds to `.ping` command

---

**🎉 Congratulations! Your production-ready WhatsDeX bot is now running with all infrastructure fixes applied!**
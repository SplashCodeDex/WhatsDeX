# 🚀 Getting Started with WhatsDeX

<div align="center">

![Getting Started](https://img.shields.io/badge/WhatsDeX-Getting%20Started-brightgreen?style=for-the-badge&logo=rocket&logoColor=white)
![Time](https://img.shields.io/badge/Time%20to%20Complete-10%20minutes-blue?style=flat-square)
![Difficulty](https://img.shields.io/badge/Difficulty-Beginner-green?style=flat-square)

**Your complete guide to setting up WhatsDeX in under 10 minutes**

[📚 Back to Docs](../docs/README.md) • [🔧 Installation](../README.md#installation) • [🎯 Next: Basic Commands](features/commands/basic-commands.md)

---

</div>

## 🎯 Prerequisites

Before you begin, ensure you have the following:

### System Requirements

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **WhatsApp Account** - Personal or Business account
- **Stable Internet Connection** - For API calls and WhatsApp Web
- **2GB RAM** minimum, 4GB recommended

### Optional (for advanced features)

- **Database**: PostgreSQL, MySQL, or MongoDB
- **Redis**: For caching and session management
- **Docker**: For containerized deployment

---

## ⚡ Quick Setup (5 Minutes)

### Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/SplashCodeDex/WhatsDeX.git
cd whatsdex

# Install all dependencies (bot + dashboard)
npm run install:all

# Expected output:
# ✅ Bot dependencies installed
# ✅ Dashboard dependencies installed
# ✅ All packages ready
```

### Step 2: Configure Environment

Create a `.env` file in the root directory:

```bash
# Copy the example environment file
cp .env.example .env

# Edit with your API keys
nano .env  # or use your preferred editor
```

**Essential Configuration:**

```env
# Required: Google Gemini AI API Key
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Database (leave as file for basic usage)
DATABASE_URL=file:./database.db

# Optional: Redis (leave empty for basic usage)
REDIS_URL=
```

> 💡 **Get your Gemini API Key:**
>
> 1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
> 2. Create a new API key
> 3. Copy and paste it into your `.env` file

### Step 3: Start Development Environment

```bash
# Start both bot and dashboard
npm run dev:full

# Expected output:
# 🚀 WhatsDeX Bot starting...
# 🎛️ Dashboard available at http://localhost:3000
# 📱 Scan QR code to connect WhatsApp
```

### Step 4: Connect WhatsApp

1. **Open your browser** to `http://localhost:3000`
2. **Scan the QR code** with WhatsApp Web
3. **Wait for connection** - you'll see "Connected" status

![QR Code Setup](../screenshots/qr-setup.png)
_Figure 1: WhatsApp Web QR code scanning process_

---

## 📱 First Bot Interaction

### Send Your First Message

Once connected, send a message to your bot's WhatsApp number:

```
You: Hello WhatsDeX!
Bot: 👋 Hello! I'm your AI-powered WhatsApp assistant!

You: /menu
Bot: 🤖 WhatsDeX Command Menu
      🤖 AI Chat: /gemini, /chatgpt, /deepseek
      🎵 Media: /sticker, /toimage, /download
      🛠️ Tools: /weather, /translate, /ocr
      🎮 Games: /quiz, /family100, /suit
      ... and 95+ more commands!
```

### Try AI Features

**Example 1: AI Chat**

```
You: /gemini Tell me a joke about programming
Bot: 🤖 Why do programmers prefer dark mode?
     Because light attracts bugs! 🐛
```

**Example 2: Weather Information**

```
You: /weather Tokyo
Bot: 🌤️ Weather in Tokyo:
      Temperature: 28°C (82°F)
      Condition: Sunny
      Humidity: 65%
      Wind: 15 km/h NW
```

**Example 3: Media Processing**

```
You: [Send an image]
Bot: 📸 Image received! Processing...

You: /sticker
Bot: 🎨 AI-generated sticker created!
     [Sticker sent automatically]
```

---

## 🎛️ Dashboard Overview

### Accessing the Admin Interface

1. **Open** `http://localhost:3000` in your browser
2. **Navigate** through the dashboard sections
3. **Monitor** real-time analytics and user activity

### Key Dashboard Features

#### 📊 Real-Time Analytics

- **Active Users**: See who's using your bot
- **Command Usage**: Track popular commands
- **Performance Metrics**: Response times and error rates
- **System Health**: Uptime and resource usage

#### 👥 User Management

- **User List**: View all bot users
- **Role Assignment**: Set admin/moderator permissions
- **Bulk Actions**: Send messages to multiple users
- **Activity Logs**: Complete user activity history

#### ⚙️ System Configuration

- **Bot Settings**: Configure command permissions
- **AI Settings**: Adjust Gemini parameters
- **Security Settings**: Rate limiting and moderation
- **Backup & Restore**: Data management tools

---

## 🔧 Basic Configuration

### Essential Settings

#### 1. Bot Permissions

```javascript
// In your .env file
BOT_MAX_COMMANDS_PER_HOUR = 1000;
BOT_MAX_USERS_PER_GROUP = 500;
BOT_RATE_LIMIT_WINDOW = 60000; // 1 minute
```

#### 2. AI Configuration

```javascript
// Gemini AI settings
GEMINI_TEMPERATURE = 0.7;
GEMINI_MAX_TOKENS = 2048;
GEMINI_MODEL = gemini - 1.5 - flash;
```

#### 3. Database Setup (Optional)

```bash
# For PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/whatsdex

# For MySQL
DATABASE_URL=mysql://user:password@localhost:3306/whatsdex

# For MongoDB
DATABASE_URL=mongodb://localhost:27017/whatsdex
```

### Advanced Settings

#### Redis Caching (Recommended for Production)

```bash
# Install Redis
# Ubuntu/Debian: sudo apt install redis-server
# macOS: brew install redis
# Windows: Download from redis.io

# Configure in .env
REDIS_URL=redis://localhost:6379
CACHE_TTL=1800  // 30 minutes
```

#### External API Keys

```env
# Optional: Additional AI providers
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_claude_key

# Optional: External services
WEATHER_API_KEY=your_weather_key
TRANSLATE_API_KEY=your_translate_key
```

---

## 🧪 Testing Your Setup

### Health Check Commands

```bash
# Check bot status
npm run health:check

# Test AI integration
npm run test:ai

# Verify database connection
npm run test:db
```

### Manual Testing Checklist

- [ ] **QR Code Scanning**: Successfully connected to WhatsApp
- [ ] **Basic Commands**: `/menu` and `/help` work
- [ ] **AI Features**: `/gemini` responds correctly
- [ ] **Media Processing**: Image upload and sticker creation
- [ ] **Dashboard Access**: Web interface loads properly
- [ ] **User Management**: Can view users in dashboard
- [ ] **Analytics**: Real-time metrics updating

### Troubleshooting Common Issues

#### Connection Problems

```bash
# Clear WhatsApp session
rm -rf sessions/*

# Restart the bot
npm run dev
```

#### API Key Issues

```bash
# Test Gemini API key
curl -H "Authorization: Bearer $GOOGLE_GEMINI_API_KEY" \
     https://generativelanguage.googleapis.com/v1/models
```

#### Database Errors

```bash
# Reset database
npm run migrate:reset
npm run migrate
```

---

## 🚀 Next Steps

### Level Up Your Bot

#### 1. **Add Custom Commands**

Learn to create your own bot commands:

```javascript
// Save as commands/custom/hello.js
module.exports = {
  name: 'hello',
  category: 'custom',
  code: async ctx => {
    return ctx.reply('👋 Hello from my custom command!');
  },
};
```

#### 2. **Explore Advanced Features**

- **Plugin System**: Extend bot functionality
- **Webhook Integration**: Connect external services
- **Multi-Language Support**: Add localization
- **Custom AI Prompts**: Create specialized AI behaviors

#### 3. **Production Deployment**

- **PM2 Clustering**: Scale your bot
- **Docker Containers**: Easy deployment
- **Cloud Hosting**: AWS, Railway, or Vercel
- **Monitoring**: Set up alerts and logging

### Learning Resources

#### 📚 Documentation

- **[Command Reference](features/commands/)** - Complete command list
- **[API Documentation](api-reference.md)** - Technical API docs
- **[Deployment Guide](../deployment/production.md)** - Production setup

#### 🎥 Video Tutorials

- **"Building Your First WhatsDeX Bot"** - Step-by-step video guide
- **"Custom Commands Deep Dive"** - Advanced command creation
- **"Production Deployment"** - Scaling and monitoring

#### 💬 Community

- **GitHub Discussions** - Ask questions and share ideas
- **Discord Server** - Real-time help and community chat
- **Stack Overflow** - Technical Q&A with `whatsdex` tag

---

## 🎯 Quick Reference

### Essential Commands

```bash
# Development
npm run dev              # Start development server
npm run dev:full         # Start bot + dashboard
npm run build           # Build for production
npm run test            # Run test suite

# Production
npm run start:prod      # Start in production mode
npm run start:pm2       # Start with PM2 clustering

# Database
npm run migrate         # Run database migrations
npm run studio          # Open Prisma Studio

# Docker
npm run docker:build    # Build Docker image
npm run docker:run      # Run Docker container
```

### File Structure

```
whatsdex/
├── 📁 commands/         # Bot command modules
├── 🔧 services/         # Core business logic
├── 🌐 web/             # Admin dashboard
├── 🗄️ database/        # Data persistence
├── 🛡️ middleware/      # Express middleware
├── 📊 routes/          # API endpoints
└── 🧪 tests/           # Test suites
```

### Support Contacts

- **📧 General Help**: support@whatsdex.com
- **🐛 Bug Reports**: [GitHub Issues](../../issues)
- **💬 Community**: [Discord Server](https://discord.gg/whatsdex)
- **🏢 Enterprise**: enterprise@whatsdex.com

---

<div align="center">

**🎉 Congratulations! Your WhatsDeX bot is now ready!**

[📚 Explore Features](features/) • [🔧 Customize Commands](development/plugin-system.md) • [🚀 Deploy to Production](../deployment/production.md)

---

_Need help? Join our [Discord community](https://discord.gg/whatsdex) or check the [troubleshooting guide](../support/troubleshooting.md)_

</div>

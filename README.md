# WhatsDeX 🤖

<div align="center">

![WhatsDeX Logo](https://img.shields.io/badge/WhatsDeX-Advanced%20AI%20Bot-blue?style=for-the-badge&logo=whatsapp&logoColor=white)
![Version](https://img.shields.io/badge/version-1.4.13--alpha.1-orange?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)
![WhatsApp](https://img.shields.io/badge/WhatsApp-API-25D366?style=flat-square&logo=whatsapp&logoColor=white)

**Advanced WhatsApp Automation Platform with AI Integration**

[🚀 Quick Start](#-quick-start) • [📚 Documentation](#-documentation) • [🔧 Installation](#-installation) • [🎯 Features](#-key-features) • [🤝 Contributing](#-contributing)

---

</div>

## 🌟 Overview

`WhatsDeX` is a **production-grade WhatsApp automation platform** that combines the power of artificial intelligence with enterprise-level bot management. Built for developers, businesses, and organizations requiring sophisticated WhatsApp automation capabilities.

### 🎯 What Makes WhatsDeX Special

- **🤖 AI-Powered Conversations**: Integrated with Google's Gemini AI for natural, context-aware interactions
- **🏗️ Enterprise Architecture**: Modular design supporting 100+ commands across multiple categories
- **📊 Real-Time Analytics**: Comprehensive dashboard with performance metrics and user insights
- **🔒 Security First**: Built-in rate limiting, content moderation, and audit logging
- **🚀 Production Ready**: Docker support, PM2 clustering, and enterprise deployment options
- **🔧 Developer Friendly**: Extensive API, webhook support, and plugin architecture

### 🏗️ Architecture

```
WhatsDeX Platform
├── 🤖 WhatsApp Bot (Core Engine)
│   ├── 💬 AI Chat System (Gemini Integration)
│   ├── 🎮 Game Commands (Trivia, Games)
│   ├── 🎬 Media Processing (Images, Videos)
│   ├── 🔧 Utility Tools (Translation, Weather)
│   └── 📚 Educational Content (Quizzes, Facts)
├── 🎛️ Admin Dashboard (Next.js)
│   ├── 📈 Real-Time Analytics
│   ├── 👥 User Management
│   ├── ⚙️ System Configuration
│   └── 📋 Audit & Moderation
└── 🔧 Backend Services
    ├── 🗄️ Database Layer (PostgreSQL/MySQL/MongoDB)
    ├── 🔄 Job Queue (Bull/Redis)
    ├── 📊 Analytics Engine
    └── 🛡️ Security & Moderation
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** with npm or yarn
- **WhatsApp Account** for bot authentication
- **Database** (PostgreSQL/MySQL/MongoDB) - optional for basic usage
- **Redis** - optional for advanced features

### ⚡ One-Command Setup

```bash
# Clone and setup everything
git clone https://github.com/SplashCodeDex/WhatsDeX.git
cd whatsdex
npm run install:all
npm run dev:full
```

That's it! Your AI-powered WhatsApp bot and admin dashboard will be running locally.

---

## 📦 Installation

### Option 1: Full-Stack Development (Recommended)

```bash
# Clone repository
git clone https://github.com/SplashCodeDex/WhatsDeX.git
cd whatsdex

# Install all dependencies (bot + dashboard)
npm run install:all

# Start development environment
npm run dev:full
```

### Option 2: Bot Only (Lightweight)

```bash
# Install bot dependencies only
npm install

# Start bot in development mode
npm run dev
```

### Option 3: Docker Deployment

```bash
# Build and run with Docker Compose
npm run docker:build:full
npm run docker:run:full
```

### Option 4: Production Deployment

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Start in production mode
npm run start:prod
```

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# WhatsApp Bot Configuration
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
SESSION_STORAGE_TYPE=file  # or 'mysql', 'mongodb', 'firebase'

# Database Configuration (Optional)
DATABASE_URL=postgresql://user:password@localhost:5432/whatsdex
REDIS_URL=redis://localhost:6379

# Admin Dashboard
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Security
ENCRYPTION_KEY=your_32_character_encryption_key
JWT_SECRET=your_jwt_secret

# Optional: External APIs
OPENAI_API_KEY=your_openai_key
STRIPE_SECRET_KEY=your_stripe_key
```

### Database Setup

WhatsDeX supports multiple database adapters:

#### PostgreSQL (Recommended for Production)
```bash
# Install PostgreSQL and create database
createdb whatsdex

# Run migrations
npm run migrate
npm run generate
```

#### MySQL
```bash
# Create MySQL database
mysql -u root -p -e "CREATE DATABASE whatsdex;"

# Install adapter
npm run install:adapter
```

#### MongoDB
```bash
# Start MongoDB service
mongosh
use whatsdex

# Install adapter
npm run install:adapter
```

---

## 🎯 Key Features

### 🤖 AI-Powered Bot Engine

#### Gemini AI Integration
- **Natural Conversations**: Context-aware responses using Google's Gemini 1.5 Flash
- **Function Calling**: Execute bot commands through AI conversations
- **Memory Management**: Automatic conversation summarization for long chats
- **Multi-Modal Support**: Text, images, and mixed media processing

#### Command Categories (100+ Commands)

| Category | Commands | Description |
|----------|----------|-------------|
| 🤖 **AI Chat** | `gemini`, `chatgpt`, `deepseek`, `felo`, `venice` | Multiple AI providers with conversation memory |
| 🎬 **Media** | `sticker`, `toimage`, `togif`, `upscale`, `removebg` | Image/video processing and conversion |
| 🎵 **Downloader** | `youtube`, `instagram`, `tiktok`, `spotify` | Social media content downloading |
| 🎮 **Games** | `family100`, `tebakgambar`, `kuis`, `suit` | Interactive games and quizzes |
| 🛠️ **Tools** | `translate`, `weather`, `ocr`, `carbonify` | Utility functions and APIs |
| 🎭 **Fun** | `meme`, `joke`, `quote`, `artinama` | Entertainment and lifestyle |
| 👥 **Group** | `add`, `kick`, `promote`, `hidetag` | Group management tools |
| 📚 **Education** | `mathquiz`, `translate`, `alkitab` | Learning and reference |

### 🎛️ Admin Dashboard

#### Real-Time Analytics
- **Performance Metrics**: Response times, cache hit rates, error tracking
- **User Statistics**: Active users, command usage, engagement metrics
- **System Health**: Uptime monitoring, resource usage, API status

#### User Management
- **Role-Based Access**: Admin, moderator, and user permissions
- **Bulk Operations**: Mass messaging, user imports/exports
- **Audit Trails**: Complete activity logging and compliance reporting

#### Content Moderation
- **AI-Powered Filtering**: Automatic content analysis and flagging
- **Manual Review Queue**: Human oversight for sensitive content
- **Custom Rules Engine**: Configurable moderation policies

### 🔒 Security & Compliance

#### Enterprise Security Features
- **Rate Limiting**: Configurable request throttling per user/IP
- **Content Moderation**: AI-powered content filtering and analysis
- **Audit Logging**: Comprehensive activity tracking and reporting
- **Encryption**: End-to-end encryption for sensitive data
- **Access Control**: Role-based permissions and authentication

#### Compliance Ready
- **GDPR Compliant**: Data protection and user consent management
- **SOC2 Ready**: Security controls and audit trails
- **HIPAA Compatible**: Healthcare data protection (with proper configuration)

---

## 📚 Documentation

### 📖 User Guides

#### For Beginners
1. **[Getting Started](docs/getting-started.md)** - Complete setup guide for new users
2. **[Basic Commands](docs/basic-commands.md)** - Essential bot commands and usage
3. **[Configuration](docs/configuration.md)** - Environment setup and customization

#### For Developers
1. **[API Reference](docs/api-reference.md)** - Complete API documentation
2. **[Plugin Development](docs/plugin-development.md)** - Create custom commands
3. **[Database Schema](docs/database-schema.md)** - Data models and relationships

#### For Administrators
1. **[Deployment Guide](docs/deployment.md)** - Production deployment strategies
2. **[Security Best Practices](docs/security.md)** - Security hardening and compliance
3. **[Monitoring & Maintenance](docs/monitoring.md)** - System monitoring and troubleshooting

### 🛠️ Development

#### Project Structure
```
whatsdex/
├── 📁 commands/          # Bot command modules (100+ commands)
│   ├── 🤖 ai-chat/       # AI conversation handlers
│   ├── 🎬 converter/     # Media conversion tools
│   ├── 📥 downloader/    # Content downloaders
│   ├── 🎮 game/          # Interactive games
│   └── 🛠️ tool/          # Utility functions
├── 🔧 services/          # Core business logic
│   ├── 💬 gemini.js      # AI service integration
│   ├── 📊 analytics.js   # Analytics processing
│   └── 🔄 jobQueue.js    # Background job processing
├── 🌐 web/               # Admin dashboard (Next.js)
│   ├── 📈 pages/         # Dashboard pages
│   ├── 🧩 components/    # Reusable UI components
│   └── 🎨 styles/        # Styling and themes
├── 🗄️ database/          # Data persistence layer
│   ├── 📋 models/        # Database models
│   └── 🔗 connections/   # Database adapters
├── 🛡️ middleware/        # Express middleware
│   ├── 🔐 auth.js        # Authentication
│   ├── 🛑 rateLimit.js   # Rate limiting
│   └── 📝 audit.js       # Audit logging
└── 🧪 tests/             # Test suites
    ├── 🔬 unit/          # Unit tests
    ├── 🔗 integration/   # Integration tests
    └── 🎭 e2e/           # End-to-end tests
```

#### Code Examples

##### Basic Bot Command
```javascript
module.exports = {
  name: 'hello',
  category: 'main',
  permissions: { coin: 0 },
  code: async (ctx) => {
    const { formatter } = ctx.bot.context;
    return ctx.reply(formatter.success('Hello! 👋 Welcome to WhatsDeX!'));
  }
};
```

##### AI Command with Tool Calling
```javascript
// See commands/ai-chat/gemini.js for full implementation
// Features: conversation memory, tool execution, summarization
```

##### Custom Middleware
```javascript
// middleware/customAuth.js
module.exports = async (ctx, next) => {
  // Custom authentication logic
  if (!ctx.isAuthenticated) {
    return ctx.reply('Authentication required!');
  }
  await next();
};
```

---

## 🔌 API Reference

### REST API Endpoints

#### Authentication
```http
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/session
```

#### User Management
```http
GET    /api/users
POST   /api/users
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id
```

#### Analytics
```http
GET /api/analytics/overview
GET /api/analytics/commands
GET /api/analytics/users
GET /api/analytics/performance
```

#### System Management
```http
GET  /api/system/health
GET  /api/system/logs
POST /api/system/backup
GET  /api/system/config
```

### WebSocket Events

#### Real-Time Updates
```javascript
// Connect to WebSocket
const socket = io('http://localhost:3000');

// Listen for events
socket.on('user_joined', (data) => {
  console.log('New user:', data);
});

socket.on('command_executed', (data) => {
  console.log('Command executed:', data);
});

socket.on('system_alert', (data) => {
  console.log('System alert:', data);
});
```

### Bot Commands API

#### Programmatic Command Execution
```javascript
const { WhatsDeX } = require('whatsdex');

// Initialize bot
const bot = new WhatsDeX({
  apiKey: process.env.GOOGLE_GEMINI_API_KEY
});

// Execute command programmatically
await bot.executeCommand('gemini', {
  text: 'Hello AI!',
  userId: '1234567890'
});
```

---

## 🚀 Deployment

### Development Environment

```bash
# Start all services
npm run dev:full

# Bot will be available at localhost:3000 (dashboard)
# WhatsApp bot ready for pairing
```

### Production Deployment

#### Using PM2 (Recommended)
```bash
# Start with PM2
npm run start:pm2

# Check status
pm2 status

# View logs
pm2 logs whatsdex
```

#### Using Docker
```bash
# Build production image
docker build -t whatsdex:prod .

# Run with environment variables
docker run -d \
  --name whatsdex \
  -p 3000:3000 \
  -e GOOGLE_GEMINI_API_KEY=your_key \
  whatsdex:prod
```

#### Cloud Deployment

##### Vercel (Dashboard Only)
```bash
cd web
npm install -g vercel
vercel --prod
```

##### Railway
```bash
# Connect GitHub repo to Railway
# Automatic deployments on push
# Built-in database and Redis support
```

##### AWS/Heroku
```bash
# Standard Node.js deployment
npm run build
npm run start:prod
```

### Scaling Considerations

#### Horizontal Scaling
- **PM2 Clustering**: `pm2 start ecosystem.config.js`
- **Load Balancing**: Nginx reverse proxy configuration
- **Database Sharding**: For high-traffic deployments

#### Performance Optimization
- **Redis Caching**: Enable for AI responses and session data
- **CDN Integration**: For static assets and media files
- **Database Indexing**: Optimize queries for large datasets

---

## 🔧 Troubleshooting

### Common Issues

#### Authentication Problems
```bash
# Clear session data
rm -rf sessions/*

# Reset database
npm run migrate:reset

# Check logs
tail -f logs/bot.log
```

#### Performance Issues
```bash
# Check system resources
top
htop

# Monitor Redis
redis-cli info

# Check database connections
npm run db:status
```

#### API Errors
```bash
# Test Gemini API
curl -H "Authorization: Bearer $GOOGLE_GEMINI_API_KEY" \
     https://generativelanguage.googleapis.com/v1/models

# Check rate limits
npm run security-audit
```

### Debug Mode

```bash
# Enable debug logging
DEBUG=whatsdex:* npm run dev

# Verbose AI logging
DEBUG=whatsdex:ai:* npm run dev
```

### Getting Help

- **📖 Documentation**: [docs/](docs/) folder
- **🐛 Issue Tracker**: [GitHub Issues](https://github.com/SplashCodeDex/WhatsDeX/issues)
- **💬 Community**: [Discord Server](https://discord.gg/whatsdex)
- **📧 Enterprise Support**: enterprise@whatsdex.com

---

## 🤝 Contributing

We welcome contributions from developers of all skill levels! Here's how to get started:

### Development Setup

```bash
# Fork and clone
git clone https://github.com/yourusername/WhatsDeX.git
cd whatsdex

# Setup development environment
npm run install:all
cp .env.example .env
# Edit .env with your API keys

# Run tests
npm test

# Start development
npm run dev:full
```

### Contribution Guidelines

#### Code Style
- **ESLint**: Follow the configured ESLint rules
- **Prettier**: Code formatting is enforced
- **TypeScript**: Preferred for new components

#### Testing
```bash
# Run all tests
npm test

# Run specific test suite
npm test -- --testPathPattern=commands

# E2E testing
npm run e2e
```

#### Pull Request Process
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

#### Commit Convention
```bash
# Format: type(scope): description
feat(auth): add OAuth2 support
fix(api): resolve rate limiting bug
docs(readme): update installation guide
test(commands): add unit tests for AI commands
```

### Areas for Contribution

#### 🔧 Core Development
- **New AI Providers**: Add support for Claude, Mistral, etc.
- **Command Modules**: Create new utility or entertainment commands
- **Database Adapters**: Support for additional databases
- **API Integrations**: Weather, news, social media APIs

#### 🎨 Frontend Development
- **Dashboard Components**: New analytics widgets and tools
- **UI/UX Improvements**: Enhanced user experience and accessibility
- **Theme System**: Dark/light mode and custom themes
- **Mobile Responsiveness**: Optimize for mobile devices

#### 📊 Analytics & Monitoring
- **Performance Metrics**: Advanced monitoring and alerting
- **User Analytics**: Behavior tracking and insights
- **Audit System**: Enhanced compliance and security logging
- **Reporting Tools**: Automated report generation

#### 🧪 Testing & Quality
- **Unit Tests**: Increase test coverage
- **Integration Tests**: API and database testing
- **E2E Tests**: User journey automation
- **Performance Testing**: Load and stress testing

#### 📚 Documentation
- **API Documentation**: OpenAPI/Swagger specs
- **User Guides**: Tutorials and examples
- **Video Tutorials**: Screencasts and demos
- **Internationalization**: Multi-language support

### Recognition

Contributors are recognized in:
- **Release Notes**: Featured in changelog
- **Contributors File**: Listed in repository
- **Hall of Fame**: Top contributors highlighted
- **Swag Program**: Exclusive WhatsDeX merchandise

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### Third-Party Licenses

WhatsDeX uses several open-source libraries:
- **@whiskeysockets/baileys**: WhatsApp Web API (MIT)
- **@google/generative-ai**: Gemini AI SDK (Apache 2.0)
- **express**: Web framework (MIT)
- **prisma**: Database ORM (Apache 2.0)

---

## 🙏 Acknowledgments

### Core Team
- **CodeDeX** - Project Lead & Core Developer
- **Contributors** - Open source community members

### Technologies & Services
- **Google Gemini AI** - Conversational AI capabilities
- **WhatsApp Web** - Messaging platform integration
- **Node.js** - Runtime environment
- **Next.js** - React framework for dashboard
- **PostgreSQL** - Primary database
- **Redis** - Caching and session storage
- **PM2** - Process management
- **Docker** - Containerization

### Community
- **Open Source Contributors** - Bug fixes, features, documentation
- **Beta Testers** - Feedback and testing
- **Users** - Adoption and support

---

## 📞 Support

### Community Support
- **GitHub Discussions**: General questions and community chat
- **Discord Server**: Real-time help and community events
- **Stack Overflow**: Technical questions (tag: `whatsdex`)

### Enterprise Support
- **24/7 Support**: Priority response for enterprise customers
- **Dedicated SRE**: Site reliability engineering support
- **Custom Development**: Bespoke features and integrations
- **Training**: Team training and onboarding

### Contact Information
- **Email**: support@whatsdex.com
- **Enterprise**: enterprise@whatsdex.com
- **Security**: security@whatsdex.com
- **Website**: https://whatsdex.com

---

## 🔄 Changelog

### Version 1.4.13-alpha.1 (Latest)
- ✨ **AI Integration**: Enhanced Gemini AI with function calling
- 🔒 **Security**: Improved rate limiting and content moderation
- 🎛️ **Dashboard**: Complete admin interface with real-time analytics
- 🐳 **Docker**: Full containerization support
- 📊 **Analytics**: Comprehensive performance monitoring
- 🧪 **Testing**: Expanded test coverage and CI/CD pipeline

### Previous Versions
- [View Full Changelog](CHANGELOG.md)

---

<div align="center">

**Made with ❤️ by the WhatsDeX Community**

[⭐ Star us on GitHub](https://github.com/SplashCodeDex/WhatsDeX) • [🐛 Report Issues](https://github.com/SplashCodeDex/WhatsDeX/issues) • [📖 Read the Docs](docs/)

---

*WhatsDeX is not affiliated with WhatsApp, Meta, or any other third-party services. Use responsibly and in accordance with platform terms of service.*

</div>
# 🚀 WhatsDeX - Updated Deployment Guide (API Architecture)

## 📋 Overview

This guide covers deploying the **newly restructured WhatsDeX** with:
- **Separated Frontend** (Next.js on port 3000)
- **Backend API Server** (Express + Prisma on port 3001) 
- **Internal API Communication** between layers
- **Production-ready configuration**

## 🏗️ Architecture Components

```
┌─────────────────┐    HTTP API     ┌─────────────────┐    Prisma    ┌─────────────┐
│   Frontend      │ ──────────────► │   Backend API   │ ───────────► │  Database   │
│   (Next.js)     │                 │   (Express)     │              │ (PostgreSQL)│
│   Port 3000     │                 │   Port 3001     │              │             │
└─────────────────┘                 └─────────────────┘              └─────────────┘
```

## 🚀 Quick Deployment Options

### Option 1: Docker Compose (Recommended)
### Option 2: Manual Deployment  
### Option 3: Cloud Platform Specific

---

## 🐳 Option 1: Docker Compose Deployment

### 1. Create Updated Production Compose File

```yaml
# production-api.docker-compose.yml
version: '3.8'

services:
  # Backend API Server
  backend:
    build:
      context: .
      dockerfile: deployment/dockerfiles/Dockerfile.api
    container_name: whatsdx-backend
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - INTERNAL_API_KEY=${INTERNAL_API_KEY}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}
    depends_on:
      - postgres
      - redis
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    networks:
      - whatsdx-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Frontend Web Application
  frontend:
    build:
      context: ./web
      dockerfile: ../deployment/dockerfiles/Dockerfile.web
    container_name: whatsdx-frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=http://backend:3001
      - INTERNAL_API_KEY=${INTERNAL_API_KEY}
    depends_on:
      - backend
    networks:
      - whatsdx-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: whatsdx-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_DB=${POSTGRES_DB:-whatsdx}
      - POSTGRES_USER=${POSTGRES_USER:-whatsdx}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql:ro
    networks:
      - whatsdx-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-whatsdx}"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Redis for Caching & Sessions
  redis:
    image: redis:7-alpine
    container_name: whatsdx-redis
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - whatsdx-network
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: whatsdx-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./deployment/nginx/nginx.prod.conf:/etc/nginx/nginx.conf:ro
      - ./deployment/ssl:/etc/nginx/ssl:ro
      - ./web/public:/var/www/static:ro
    depends_on:
      - frontend
      - backend
    networks:
      - whatsdx-network
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local

networks:
  whatsdx-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

### 2. Create Backend API Dockerfile

```dockerfile
# deployment/dockerfiles/Dockerfile.api
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production
RUN npx prisma generate

# Copy application code
COPY . .
COPY src ./src
COPY routes ./routes
COPY tools ./tools
COPY utils ./utils
COPY commands ./commands
COPY database ./database
COPY middleware ./middleware
COPY services ./services

# Create uploads and logs directories
RUN mkdir -p uploads logs

# Set permissions
RUN chown -R node:node /app
USER node

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

EXPOSE 3001

CMD ["node", "src/server/multiTenantApp.js"]
```

### 3. Create Frontend Dockerfile

```dockerfile
# deployment/dockerfiles/Dockerfile.web
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY ../shared ./shared

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### 4. Create Production Environment File

```bash
# deployment/.env.production
# Database Configuration
DATABASE_URL="postgresql://whatsdx:your_secure_password@postgres:5432/whatsdx"
POSTGRES_DB=whatsdx
POSTGRES_USER=whatsdx
POSTGRES_PASSWORD=your_secure_password

# Redis Configuration
REDIS_URL="redis://:your_redis_password@redis:6379"
REDIS_PASSWORD=your_redis_password

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_here

# Internal API Security
INTERNAL_API_KEY=your_internal_api_key_change_in_production

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PUBLIC_KEY=pk_live_your_stripe_public_key

# App Configuration
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@domain.com
SMTP_PASS=your_email_password

# Monitoring (Optional)
SENTRY_DSN=your_sentry_dsn
```

### 5. Update Nginx Configuration

```nginx
# deployment/nginx/nginx.prod.conf
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:3001;
    }
    
    upstream frontend {
        server frontend:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=web:10m rate=30r/s;

    server {
        listen 80;
        server_name _;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";

        # API routes to backend
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Timeout settings
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Health check for backend
        location /health {
            proxy_pass http://backend/health;
            access_log off;
        }

        # Static files
        location /uploads/ {
            alias /var/www/uploads/;
            expires 30d;
            add_header Cache-Control "public, immutable";
        }

        # Frontend application
        location / {
            limit_req zone=web burst=50 nodelay;
            
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # WebSocket support for Next.js dev
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }
}
```

---

## 🚀 Deployment Steps

### 1. Prepare Environment

```bash
# Clone repository
git clone <your-repo-url>
cd WhatsDeX

# Copy and configure environment
cp deployment/.env.production deployment/.env
# Edit deployment/.env with your actual values
```

### 2. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# (Optional) Seed initial data
npx prisma db seed
```

### 3. Deploy with Docker Compose

```bash
# Build and start all services
docker-compose -f deployment/production-api.docker-compose.yml --env-file deployment/.env up -d

# Check service status
docker-compose -f deployment/production-api.docker-compose.yml ps

# View logs
docker-compose -f deployment/production-api.docker-compose.yml logs -f
```

### 4. Verify Deployment

```bash
# Test backend health
curl http://localhost:3001/health

# Test frontend
curl http://localhost:3000

# Test API communication
curl -H "x-internal-api-key: your_internal_api_key" \
     http://localhost:3001/api/internal/stripe/plans
```

---

## 🌐 Option 2: Cloud Platform Deployment

### Vercel (Frontend) + Railway (Backend)

**Frontend on Vercel:**
```bash
# In web/ directory
npm run build
vercel --prod
```

**Backend on Railway:**
```bash
# Deploy backend
railway login
railway link
railway up
```

### Docker Swarm / Kubernetes

See deployment/kubernetes/ for K8s manifests.

---

## 🔒 Security Checklist

- [ ] Change all default passwords
- [ ] Set strong JWT_SECRET
- [ ] Configure INTERNAL_API_KEY
- [ ] Set up SSL certificates
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Set up monitoring
- [ ] Configure backups

---

## 📊 Monitoring Setup

```bash
# Start with monitoring
docker-compose -f deployment/production-api.docker-compose.yml \
               -f deployment/docker-compose.monitoring.yml \
               --env-file deployment/.env up -d

# Access dashboards
# Grafana: http://localhost:3000
# Prometheus: http://localhost:9090
```

---

## 🔄 Updates & Maintenance

```bash
# Update application
git pull origin main
docker-compose -f deployment/production-api.docker-compose.yml build
docker-compose -f deployment/production-api.docker-compose.yml up -d

# Database migrations
docker-compose -f deployment/production-api.docker-compose.yml exec backend npx prisma migrate deploy

# Backup database
docker-compose -f deployment/production-api.docker-compose.yml exec postgres pg_dump -U whatsdx whatsdx > backup.sql
```

---

## 🆘 Troubleshooting

### Common Issues

1. **Frontend can't connect to backend**
   - Check NEXT_PUBLIC_API_URL
   - Verify INTERNAL_API_KEY matches
   - Check network connectivity

2. **Database connection failed**
   - Verify DATABASE_URL
   - Check PostgreSQL is running
   - Run migrations

3. **Build failures**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Verify environment variables

### Debug Commands

```bash
# Check container logs
docker logs whatsdx-backend
docker logs whatsdx-frontend

# Enter container for debugging
docker exec -it whatsdx-backend sh

# Test internal API
docker exec -it whatsdx-frontend curl -H "x-internal-api-key: key" http://backend:3001/health
```

---

Your **upgraded WhatsDeX** is now ready for production with proper API architecture! 🚀
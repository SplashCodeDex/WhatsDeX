# 🚀 WhatsDeX Admin System - Production Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the WhatsDeX admin system to production. The system includes user management, audit logging, content moderation, and analytics capabilities.

## Prerequisites

- **Node.js**: v18+ (v20 recommended)
- **PostgreSQL**: v14+
- **Redis**: v6+ (optional, for caching)
- **Nginx**: For reverse proxy
- **SSL Certificate**: For HTTPS
- **Domain Name**: Pointed to your server

## 📋 Deployment Checklist

### Phase 1: Environment Setup
- [ ] Server provisioning and security hardening
- [ ] Domain configuration and DNS setup
- [ ] SSL certificate installation
- [ ] Firewall configuration

### Phase 2: Database Setup
- [ ] PostgreSQL installation and configuration
- [ ] Database user creation and permissions
- [ ] Database backup strategy setup

### Phase 3: Application Deployment
- [ ] Source code deployment
- [ ] Environment configuration
- [ ] Database migration execution
- [ ] Application startup and testing

### Phase 4: Production Configuration
- [ ] Nginx reverse proxy setup
- [ ] SSL/TLS configuration
- [ ] Monitoring and logging setup
- [ ] Backup automation

## 🛠️ Step-by-Step Deployment

### Step 1: Server Preparation

#### 1.1 Update System
```bash
sudo apt update && sudo apt upgrade -y
```

#### 1.2 Install Required Packages
```bash
sudo apt install -y curl wget git htop ufw fail2ban
```

#### 1.3 Configure Firewall
```bash
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable
```

#### 1.4 Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### 1.5 Install PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### 1.6 Install Redis (Optional)
```bash
sudo apt install -y redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

#### 1.7 Install Nginx
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 2: Database Configuration

#### 2.1 Create Database and User
```bash
sudo -u postgres psql
```

```sql
-- Create database
CREATE DATABASE whatsdex_prod;

-- Create user
CREATE USER whatsdex_admin WITH ENCRYPTED PASSWORD 'your_secure_password_here';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE whatsdex_prod TO whatsdex_admin;

-- Exit PostgreSQL
\q
```

#### 2.2 Configure PostgreSQL for Production
```bash
sudo nano /etc/postgresql/14/main/postgresql.conf
```

Add these settings:
```ini
# Memory settings
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB

# Connection settings
max_connections = 100

# Logging
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_statement = 'ddl'
```

```bash
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

Add this line before the last line:
```ini
host    whatsdex_prod    whatsdex_admin    127.0.0.1/32    md5
```

Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

### Step 3: Application Deployment

#### 3.1 Clone Repository
```bash
cd /var/www
sudo mkdir whatsdex-admin
sudo chown $USER:$USER whatsdex-admin
cd whatsdex-admin

# Clone your repository
git clone https://github.com/yourusername/whatsdex.git .
```

#### 3.2 Install Dependencies
```bash
npm ci --production
```

#### 3.3 Environment Configuration
```bash
cp .env.example .env.production
nano .env.production
```

Configure the following variables:
```bash
# Database
DATABASE_URL="postgresql://whatsdex_admin:your_secure_password@localhost:5432/whatsdex_prod?schema=public"

# Application
NODE_ENV=production
ADMIN_PORT=3001
HOST=127.0.0.1

# Security
JWT_SECRET="your-super-secure-jwt-secret-key-change-this-in-production"
JWT_EXPIRES_IN="24h"

# Frontend
FRONTEND_URL="https://yourdomain.com"
CORS_ORIGIN="https://yourdomain.com"

# Email (configure if needed)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="noreply@yourdomain.com"
SMTP_PASSWORD="your-app-password"
```

#### 3.4 Database Migration
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Optional: Seed database with initial data
npx prisma db seed
```

#### 3.5 Build Application (if needed)
```bash
npm run build
```

### Step 4: Process Management

#### 4.1 Install PM2
```bash
sudo npm install -g pm2
```

#### 4.2 Create PM2 Ecosystem File
```bash
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'whatsdex-admin',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

#### 4.3 Start Application with PM2
```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### Step 5: Nginx Configuration

#### 5.1 Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/whatsdex-admin
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/yourdomain.crt;
    ssl_certificate_key /etc/ssl/private/yourdomain.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Proxy to admin application
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:3001/health;
        access_log off;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 5.2 Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/whatsdex-admin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 6: SSL Certificate Setup

#### 6.1 Using Let's Encrypt (Free)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

#### 6.2 Manual SSL Setup (Alternative)
```bash
# Place your certificate files in:
# /etc/ssl/certs/yourdomain.crt
# /etc/ssl/private/yourdomain.key

sudo chmod 600 /etc/ssl/private/yourdomain.key
sudo chown root:root /etc/ssl/private/yourdomain.key
```

### Step 7: Monitoring & Logging

#### 7.1 Install Monitoring Tools
```bash
sudo apt install -y prometheus-node-exporter
sudo systemctl start prometheus-node-exporter
sudo systemctl enable prometheus-node-exporter
```

#### 7.2 Log Rotation
```bash
sudo nano /etc/logrotate.d/whatsdex-admin
```

```
/var/www/whatsdex-admin/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
```

### Step 8: Backup Configuration

#### 8.1 Database Backup Script
```bash
sudo nano /usr/local/bin/whatsdex-backup.sh
```

```bash
#!/bin/bash

# Database backup script for WhatsDeX Admin
BACKUP_DIR="/var/backups/whatsdex"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="whatsdex_prod"
DB_USER="whatsdex_admin"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
pg_dump -U $DB_USER -h localhost $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/db_backup_$DATE.sql

# Remove backups older than 30 days
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +30 -delete

# Log backup
echo "$(date): Database backup completed - $BACKUP_DIR/db_backup_$DATE.sql.gz" >> /var/log/whatsdex-backup.log
```

#### 8.2 Make Executable and Schedule
```bash
sudo chmod +x /usr/local/bin/whatsdex-backup.sh
sudo crontab -e
```

Add this line for daily backup at 2 AM:
```bash
0 2 * * * /usr/local/bin/whatsdex-backup.sh
```

## 🧪 Testing Deployment

### Health Check
```bash
curl -k https://yourdomain.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-09-03T11:36:29.750Z",
  "uptime": 123.45
}
```

### API Testing
```bash
# Test users endpoint (will require authentication)
curl -k -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     https://yourdomain.com/api/users/statistics
```

### Load Testing
```bash
# Install Apache Bench
sudo apt install -y apache2-utils

# Basic load test
ab -n 1000 -c 10 https://yourdomain.com/health
```

## 📊 Monitoring & Maintenance

### Application Monitoring
```bash
# PM2 monitoring
pm2 monit

# View logs
pm2 logs whatsdex-admin

# Restart application
pm2 restart whatsdex-admin
```

### System Monitoring
```bash
# System resources
htop

# Disk usage
df -h

# Database connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"

# Application logs
tail -f /var/www/whatsdex-admin/logs/combined.log
```

### Database Maintenance
```bash
# Analyze database performance
sudo -u postgres psql -d whatsdex_prod -c "ANALYZE;"

# Vacuum database
sudo -u postgres psql -d whatsdex_prod -c "VACUUM;"

# Check database size
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('whatsdex_prod'));"
```

## 🔧 Troubleshooting

### Common Issues

#### Application Not Starting
```bash
# Check PM2 status
pm2 status

# View application logs
pm2 logs whatsdex-admin --lines 100

# Check environment variables
pm2 show whatsdex-admin
```

#### Database Connection Issues
```bash
# Test database connection
psql -U whatsdex_admin -d whatsdex_prod -h localhost

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

#### Nginx Issues
```bash
# Test nginx configuration
sudo nginx -t

# Check nginx status
sudo systemctl status nginx

# View nginx logs
sudo tail -f /var/log/nginx/error.log
```

## 🚀 Production Optimization

### Performance Tuning

#### Node.js Optimization
```javascript
// In your ecosystem.config.js
module.exports = {
  apps: [{
    // ... other config
    node_args: '--max-old-space-size=4096',
    instances: 'max', // Use all CPU cores
    exec_mode: 'cluster'
  }]
};
```

#### Database Optimization
```sql
-- Create indexes for better performance
CREATE INDEX idx_audit_log_timestamp ON "AuditLog"("createdAt");
CREATE INDEX idx_audit_log_actor ON "AuditLog"("actor");
CREATE INDEX idx_user_jid ON "User"("jid");
CREATE INDEX idx_command_usage_user ON "CommandUsage"("userId");
```

### Security Hardening

#### SSH Hardening
```bash
sudo nano /etc/ssh/sshd_config
```

```ini
# Disable root login
PermitRootLogin no

# Use key-based authentication
PasswordAuthentication no

# Limit SSH access
AllowUsers yourusername
```

#### Fail2Ban Configuration
```bash
sudo nano /etc/fail2ban/jail.local
```

```ini
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
```

## 📚 Maintenance Procedures

### Regular Maintenance Tasks

#### Weekly Tasks
- [ ] Review application logs for errors
- [ ] Check disk usage and clean up old logs
- [ ] Verify backup integrity
- [ ] Update system packages

#### Monthly Tasks
- [ ] Review and optimize database performance
- [ ] Update SSL certificates
- [ ] Security audit and vulnerability assessment
- [ ] Performance monitoring and optimization

#### Quarterly Tasks
- [ ] Major version updates and migrations
- [ ] Security hardening review
- [ ] Disaster recovery testing
- [ ] Capacity planning

### Emergency Procedures

#### Application Down
1. Check PM2 status: `pm2 status`
2. View logs: `pm2 logs whatsdex-admin`
3. Restart application: `pm2 restart whatsdex-admin`
4. If restart fails, check system resources and database connectivity

#### Database Issues
1. Check PostgreSQL status: `sudo systemctl status postgresql`
2. Review database logs: `sudo tail -f /var/log/postgresql/postgresql-14-main.log`
3. Test connectivity: `psql -U whatsdex_admin -d whatsdex_prod`
4. Restore from backup if necessary

#### High Resource Usage
1. Monitor with `htop` or `top`
2. Check application logs for memory leaks
3. Restart application if needed
4. Scale resources if usage is consistently high

## 🎯 Success Metrics

After deployment, monitor these key metrics:

- **Application Performance**
  - Response time < 100ms
  - Uptime > 99.9%
  - Error rate < 0.1%

- **System Resources**
  - CPU usage < 70%
  - Memory usage < 80%
  - Disk usage < 85%

- **Database Performance**
  - Connection count < 80% of max
  - Query response time < 50ms
  - Cache hit rate > 90%

## 📞 Support & Documentation

- **Application Logs**: `/var/www/whatsdex-admin/logs/`
- **System Logs**: `/var/log/`
- **Database Logs**: `/var/log/postgresql/`
- **Nginx Logs**: `/var/log/nginx/`

## 🎉 Deployment Complete!

Your WhatsDeX admin system is now successfully deployed and running in production!

### Next Steps:
1. **Monitor** the application for the first 24-48 hours
2. **Test** all functionality thoroughly
3. **Configure** additional monitoring and alerting
4. **Document** any custom configurations or procedures
5. **Plan** for scaling and future updates

**🚀 Your admin system is live and ready to manage your WhatsApp bot platform!**
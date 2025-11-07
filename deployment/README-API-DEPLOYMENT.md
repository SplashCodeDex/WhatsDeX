# 🚀 WhatsDeX API Architecture - Quick Start Deployment Guide

## Overview

This guide helps you deploy the newly restructured WhatsDeX with the improved API architecture:

- **Frontend** (Next.js) - Port 3000
- **Backend API** (Express + Prisma) - Port 3001
- **PostgreSQL Database** - Internal
- **Redis Cache** - Internal
- **Nginx Proxy** - Port 80/443

## 🚀 Quick Deployment (3 Steps)

### 1. Configure Environment

```bash
cd deployment
cp .env.production.template .env.production
# Edit .env.production with your actual values
```

**⚠️ Important:** Update these critical values:
- `POSTGRES_PASSWORD` - Strong database password
- `REDIS_PASSWORD` - Strong Redis password  
- `JWT_SECRET` - 32+ character secret key
- `INTERNAL_API_KEY` - Secure API key for frontend-backend communication
- `STRIPE_*` - Your Stripe keys (if using payments)

### 2. Deploy

```bash
./quick-deploy-api.sh
```

### 3. Validate

```bash
./validate-api-deployment.sh
```

## ✅ Success Indicators

If deployment is successful, you should see:

```
🎉 ALL TESTS PASSED! (XX/XX)
✅ Your WhatsDeX API architecture is fully operational!
```

And be able to access:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Nginx Proxy**: http://localhost

## 🔧 Manual Management

### Start Services
```bash
cd deployment
docker-compose -f production-api.docker-compose.yml --env-file .env.production up -d
```

### Stop Services
```bash
docker-compose -f production-api.docker-compose.yml down
```

### View Logs
```bash
docker-compose -f production-api.docker-compose.yml logs -f
```

### Update Application
```bash
git pull origin main
./quick-deploy-api.sh
```

## 🐛 Troubleshooting

### Common Issues

**1. Port conflicts**
```bash
# Check what's using ports
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :3001
```

**2. Database connection issues**
```bash
# Check database logs
docker logs whatsdx-postgres
```

**3. Frontend can't reach backend**
```bash
# Check internal network
docker exec whatsdx-frontend ping backend
```

### Debug Commands

```bash
# Check container status
docker-compose -f production-api.docker-compose.yml ps

# Check specific service logs
docker logs whatsdx-backend
docker logs whatsdx-frontend

# Enter container for debugging
docker exec -it whatsdx-backend sh
docker exec -it whatsdx-frontend sh

# Test API manually
curl -H "x-internal-api-key: YOUR_KEY" http://localhost:3001/api/internal/stripe/plans
```

## 🌐 Production Domains

For production with custom domains:

1. **Update .env.production:**
```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

2. **Configure SSL:**
```bash
# Use the SSL compose override
docker-compose -f production-api.docker-compose.yml -f docker-compose.ssl.yml up -d
```

3. **Update DNS:**
- Point `yourdomain.com` to your server IP
- Point `api.yourdomain.com` to your server IP (or use subdirectories)

## 📊 Monitoring

### Health Checks
- Backend: `http://localhost:3001/health`
- Frontend: `http://localhost:3000`
- Nginx: `http://localhost/health`

### Performance Monitoring
```bash
# View resource usage
docker stats

# Check service health
./validate-api-deployment.sh
```

## 🔒 Security Checklist

- [ ] Changed all default passwords
- [ ] Set strong JWT_SECRET (32+ characters)
- [ ] Set secure INTERNAL_API_KEY
- [ ] Configured firewall (only expose 80, 443, 22)
- [ ] Set up SSL certificates
- [ ] Configured rate limiting (included in nginx config)
- [ ] Regular security updates

## 🔄 Backup & Updates

### Database Backup
```bash
docker exec whatsdx-postgres pg_dump -U whatsdx whatsdx > backup-$(date +%Y%m%d).sql
```

### Application Updates
```bash
git pull origin main
./quick-deploy-api.sh
```

## 📞 Support

If you encounter issues:

1. Run the validation script: `./validate-api-deployment.sh`
2. Check logs: `docker-compose logs`
3. Verify configuration: Review `.env.production`
4. Check the main deployment guide: `UPDATED_DEPLOYMENT_GUIDE.md`

---

**🎉 Congratulations!** You've successfully deployed WhatsDeX with the new API architecture that provides better scalability, maintainability, and separation of concerns.
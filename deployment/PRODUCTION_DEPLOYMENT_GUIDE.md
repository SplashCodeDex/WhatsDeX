# WhatsDeX Production Deployment Guide

This guide covers deployment to Render, Railway, AWS, and Google Cloud with the complete SaaS flow: user signup → bot assignment → template selection → QR pairing → premium features.

## Overview

WhatsDeX is now production-ready with:
- ✅ DB-backed ownership (no per-user env variables)
- ✅ Plan enforcement and usage limits
- ✅ Stripe webhook verification
- ✅ Structured bot templates and settings
- ✅ Onboarding wizard
- ✅ Admin metrics dashboard
- ✅ Multi-tenant isolation
- ✅ CI/CD with migration role separation

## Prerequisites

### Database Requirements
- PostgreSQL 12+ with pgvector extension support
- Recommended providers: Neon (with pgvector), Supabase, Aiven, Timescale Cloud

### Required Secrets
Set these in your deployment platform:

#### Core Application
- `DATABASE_URL` - App role (least privilege)
- `PRISMA_MIGRATION_SHADOW_DATABASE_URL` - Migration role (for CI/deploy only)
- `REDIS_URL` - Managed Redis instance
- `OWNER_NUMBER` - Your WhatsApp number for platform admin access

#### Authentication & Security
- `JWT_SECRET` - Random 32+ character string
- `NEXTAUTH_SECRET` - Random 32+ character string for Next.js auth

#### Stripe (Billing)
- `STRIPE_SECRET_KEY` - Test mode for staging, live for production
- `STRIPE_WEBHOOK_SECRET` - From Stripe webhook endpoint

#### AI Services (Optional)
- `GOOGLE_GEMINI_API_KEY` - For AI chat features
- `OPENAI_API_KEY` - Alternative AI provider
- `META_AI_KEY` - If using Meta AI features

## Platform-Specific Deployment

### Render

1. **Create Services from Blueprint**
   ```bash
   # Use deployment/cloud-platforms/render/render.yaml
   render-cli deploy --blueprint deployment/cloud-platforms/render/render.yaml
   ```

2. **Set Environment Variables** (in Render dashboard)
   - All secrets listed above
   - Health checks are pre-configured:
     - Bot service: `/health`
     - Web service: `/api/health`

3. **Database Setup**
   - Use Render's managed PostgreSQL or external pgvector provider
   - Ensure pgvector extension is enabled
   - Migrations run automatically via CI

4. **Post-Deploy**
   ```bash
   # Seed default plans and templates
   curl -X POST https://your-api.onrender.com/api/seed
   ```

### Railway

1. **Deploy from Config**
   ```bash
   # Use deployment/cloud-platforms/railway/railway.json
   railway up
   ```

2. **Set Environment Variables** (in Railway dashboard)
   - All secrets listed above
   - Health checks configured for `/health` (bot) and `/api/health` (web)

3. **Database Setup**
   - Use Railway's PostgreSQL plugin or external pgvector provider
   - Enable pgvector extension
   - Migrations run via CI

4. **Post-Deploy**
   ```bash
   # Seed default plans and templates
   railway run npm run seed:plans
   ```

### AWS (ECS/Fargate)

1. **Container Images**
   ```bash
   # Build and push images
   docker build -f deployment/dockerfiles/Dockerfile.api -t your-repo/whatsdx-api .
   docker build -f deployment/dockerfiles/Dockerfile.web -t your-repo/whatsdx-web ./web
   docker push your-repo/whatsdx-api
   docker push your-repo/whatsdx-web
   ```

2. **Infrastructure**
   - RDS PostgreSQL with pgvector
   - ElastiCache Redis
   - Application Load Balancer
   - ECS services with health checks:
     - API: `/health`
     - Web: `/api/health`

3. **Environment Variables**
   - Store secrets in AWS Systems Manager Parameter Store or Secrets Manager
   - Reference in ECS task definitions

4. **Database Migration**
   ```bash
   # Run as one-time ECS task
   aws ecs run-task --task-definition whatsdx-migrate
   ```

### Google Cloud (Cloud Run)

1. **Deploy Services**
   ```bash
   # API service
   gcloud run deploy whatsdx-api --image gcr.io/PROJECT/whatsdx-api

   # Web service  
   gcloud run deploy whatsdx-web --image gcr.io/PROJECT/whatsdx-web
   ```

2. **Infrastructure**
   - Cloud SQL PostgreSQL with pgvector
   - Memorystore Redis
   - Cloud Load Balancer

3. **Secrets**
   - Use Google Secret Manager
   - Mount as environment variables in Cloud Run

## Database Migration Strategy

### Two-Role Pattern (Recommended)

#### App Role (Least Privilege)
- Can SELECT, INSERT, UPDATE, DELETE on application tables
- Cannot CREATE/DROP tables or extensions
- Used by running application

#### Migration Role (High Privilege)
- Can CREATE/DROP tables and extensions
- Used only during migrations and CI/CD
- Never used by running application

#### Implementation
```sql
-- Create roles
CREATE ROLE app_user WITH LOGIN PASSWORD 'secure_password';
CREATE ROLE migration_user WITH LOGIN PASSWORD 'migration_password' SUPERUSER;

-- Grant app permissions
GRANT CONNECT ON DATABASE whatsdx TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
```

#### Environment Variables
```bash
# Running application
DATABASE_URL="postgresql://app_user:secure_password@host:5432/whatsdx"

# CI/CD and migrations only
PRISMA_MIGRATION_SHADOW_DATABASE_URL="postgresql://migration_user:migration_password@host:5432/whatsdx_shadow"
```

## Validation Checklist

### Post-Deployment Health Checks

1. **Service Health**
   - [ ] API health: `GET /health` returns 200
   - [ ] Web health: `GET /api/health` returns 200 with DB/Redis status

2. **Database Connectivity**
   - [ ] Application can connect with app role
   - [ ] pgvector extension is available
   - [ ] All tables and relations are created

3. **User Flow Validation**
   - [ ] User can register/login
   - [ ] Plan selection works
   - [ ] Bot creation succeeds
   - [ ] Template application works
   - [ ] QR pairing functions
   - [ ] Owner commands work for paired user
   - [ ] Premium features are gated by plan

4. **Stripe Integration**
   - [ ] Webhook endpoint receives events
   - [ ] Signature verification passes
   - [ ] Plan changes update entitlements
   - [ ] Usage counters increment correctly

5. **Admin Features**
   - [ ] Admin can access `/admin/metrics`
   - [ ] Tenant usage data displays correctly
   - [ ] Plan distribution shows accurate numbers

### Performance Verification

1. **Load Testing**
   ```bash
   # Test message processing
   ab -n 100 -c 10 https://your-api.com/api/bots/test-message

   # Test plan limits
   ab -n 50 -c 5 https://your-api.com/api/ai/process
   ```

2. **Database Performance**
   - [ ] Query response times < 100ms for common operations
   - [ ] Connection pooling is working
   - [ ] No connection leaks under load

## Security Checklist

### Environment Security
- [ ] No secrets in source code or logs
- [ ] JWT secrets are random and secure
- [ ] Database uses TLS/SSL
- [ ] Redis uses AUTH if exposed

### Application Security
- [ ] Owner checks are DB-backed, not env-based
- [ ] Tenant isolation is enforced in all queries
- [ ] Stripe webhooks verify signatures
- [ ] Rate limiting is active and per-tenant

### Infrastructure Security
- [ ] Database is not publicly accessible
- [ ] Redis is not publicly accessible
- [ ] Health endpoints don't leak sensitive info
- [ ] Admin endpoints check permissions

## Monitoring and Alerts

### Key Metrics to Monitor
- **Application Health**: Service uptime, response times
- **Business Metrics**: Active tenants, message volume, AI requests
- **Error Rates**: Failed authentications, webhook failures, database errors
- **Resource Usage**: CPU, memory, database connections

### Recommended Alerts
- Service health check failures
- Database connection pool exhaustion
- Stripe webhook failures
- High error rates (>5%)
- Plan limit violations

## Troubleshooting

### Common Issues

#### "Permission denied to create extension vector"
- **Cause**: App user doesn't have permission to create extensions
- **Solution**: Use migration role with PRISMA_MIGRATION_SHADOW_DATABASE_URL

#### "Owner commands not working after pairing"
- **Cause**: OWNER_NUMBER still being used instead of DB ownership
- **Solution**: Ensure UnifiedCommandSystem.isOwner is using DB lookup

#### "Plan limits not enforcing"
- **Cause**: tenantId not being passed to plan service
- **Solution**: Verify context threading in UnifiedAIProcessor

#### "Stripe webhooks failing"
- **Cause**: Invalid webhook secret or signature verification
- **Solution**: Check STRIPE_WEBHOOK_SECRET matches Stripe dashboard

## Support and Maintenance

### Regular Maintenance
- Monitor plan usage and tenant limits
- Review and rotate secrets quarterly
- Update dependencies monthly
- Backup database daily

### Scaling Considerations
- Use read replicas for analytics queries
- Scale workers horizontally for background jobs
- Implement Redis clustering for high availability
- Consider CDN for static assets

---

**Last Updated**: November 2025  
**Version**: 1.0  
**Contact**: platform-admin@yourcompany.com
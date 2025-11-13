import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';
import multiTenantService from '../services/multiTenantService.js';
import multiTenantStripeService from '../services/multiTenantStripeService.js';
import multiTenantBotService from '../services/multiTenantBotService.js';
import multiTenantRoutes from '../../routes/multiTenant.js';

const prisma = new PrismaClient();

export class MultiTenantApp {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3001;
    this.activeTenants = new Map();
    this.isInitialized = false;
  }

  async initialize() {
    try {
      logger.info('Initializing Multi-tenant WhatsDeX SaaS Platform...');

      // Setup middleware
      this.setupMiddleware();

      // Setup routes
      this.setupRoutes();

      // Initialize services
      await this.initializeServices();

      // Start active tenant bots
      await this.startActiveTenantBots();

      this.isInitialized = true;
      logger.info('Multi-tenant app initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize multi-tenant app', { error: error.message });
      throw error;
    }
  }

  setupMiddleware() {
    // Security
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS
    this.app.use(cors({
      origin: (origin, callback) => {
        // Allow all subdomains and main domain
        if (!origin || 
            origin.includes('localhost') || 
            origin.endsWith('.whatsdx.com') ||
            origin === process.env.NEXT_PUBLIC_APP_URL) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true
    }));

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: process.env.RATE_LIMIT_MAX || 100,
      message: {
        error: 'Too many requests, please try again later.'
      }
    });
    this.app.use('/api/', limiter);

    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        tenant: req.headers['x-tenant-id']
      });
      next();
    });
  }

  setupRoutes() {
    // Health check (deep)
    this.app.get('/health', async (req, res) => {
      try {
        const { runHealthChecks } = await import('../../scripts/health-check.js');
        const result = await runHealthChecks({ disconnectPrisma: true });
        const status = result.ok ? 'healthy' : 'degraded';
        res.status(result.ok ? 200 : 503).json({
          status,
          ...result,
          uptime: process.uptime(),
          version: process.env.npm_package_version || '1.0.0'
        });
      } catch (err) {
        res.status(500).json({
          status: 'error',
          error: err?.message || String(err)
        });
      }
    });

    // Internal API routes for web frontend
    this.app.use('/api/internal', multiTenantRoutes);

    // Tenant management endpoints
    this.app.get('/api/tenants', async (req, res) => {
      try {
        // Super admin only endpoint
        const tenants = await prisma.tenant.findMany({
          include: {
            tenantUsers: {
              where: { isActive: true },
              select: { id: true, name: true, email: true, role: true }
            },
            botInstances: {
              where: { isActive: true },
              select: { id: true, name: true, status: true }
            },
            subscriptions: {
              where: { status: 'active' },
              take: 1
            }
          }
        });

        res.json({ success: true, data: tenants });
      } catch (error) {
        logger.error('Failed to get tenants', { error: error.message });
        res.status(500).json({ error: 'Failed to get tenants' });
      }
    });

    // Bot management
    this.app.post('/api/bots/:botId/start', async (req, res) => {
      try {
        const { botId } = req.params;
        await multiTenantBotService.startBot(botId);
        res.json({ success: true, message: 'Bot started successfully' });
      } catch (error) {
        logger.error('Failed to start bot', { error: error.message, botId });
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/bots/:botId/stop', async (req, res) => {
      try {
        const { botId } = req.params;
        await multiTenantBotService.stopBot(botId);
        res.json({ success: true, message: 'Bot stopped successfully' });
      } catch (error) {
        logger.error('Failed to stop bot', { error: error.message, botId });
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/api/bots/:botId/qr', async (req, res) => {
      try {
        const { botId } = req.params;
        const qrCode = multiTenantBotService.getQRCode(botId);
        
        if (qrCode) {
          res.json({ success: true, qrCode });
        } else {
          res.json({ success: false, message: 'No QR code available' });
        }
      } catch (error) {
        logger.error('Failed to get QR code', { error: error.message, botId });
        res.status(500).json({ error: error.message });
      }
    });

    // Analytics endpoints
    this.app.get('/api/analytics/overview', async (req, res) => {
      try {
        const { tenantId } = req.query;
        
        if (!tenantId) {
          return res.status(400).json({ error: 'Tenant ID required' });
        }

        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const analytics = await multiTenantService.getAnalytics(
          tenantId,
          ['message_received', 'message_sent', 'user_interaction'],
          thirtyDaysAgo,
          now
        );

        res.json({ success: true, data: analytics });
      } catch (error) {
        logger.error('Failed to get analytics', { error: error.message });
        res.status(500).json({ error: 'Failed to get analytics' });
      }
    });

    // Webhook endpoints
    this.app.post('/api/webhooks/stripe', async (req, res) => {
      try {
        const signature = req.headers['stripe-signature'];
        await multiTenantStripeService.handleWebhook(req.body, signature);
        res.json({ received: true });
      } catch (error) {
        logger.error('Stripe webhook error', { error: error.message });
        res.status(400).json({ error: 'Webhook processing failed' });
      }
    });

    // Error handling
    this.app.use((error, req, res, next) => {
      logger.error('Unhandled error', { 
        error: error.message, 
        stack: error.stack,
        path: req.path,
        method: req.method
      });

      res.status(500).json({
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        path: req.path
      });
    });
  }

  async initializeServices() {
    try {
      // Initialize Stripe if configured
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      
      if (stripeKey) {
        await multiTenantStripeService.initialize(stripeKey, stripeWebhookSecret);
        logger.info('Stripe service initialized');
      } else {
        logger.warn('Stripe not configured - payment features disabled');
      }

    } catch (error) {
      logger.error('Failed to initialize services', { error: error.message });
      // Don't throw - allow app to start without some services
    }
  }

  async startActiveTenantBots() {
    try {
      logger.info('Starting active tenant bots...');

      const activeTenants = await prisma.tenant.findMany({
        where: { status: 'active' },
        include: {
          botInstances: {
            where: { isActive: true }
          }
        }
      });

      let totalBots = 0;
      for (const tenant of activeTenants) {
        try {
          await multiTenantBotService.startTenantBots(tenant.id);
          totalBots += tenant.botInstances.length;
          this.activeTenants.set(tenant.id, {
            ...tenant,
            lastActivity: new Date()
          });
        } catch (error) {
          logger.error(`Failed to start bots for tenant ${tenant.id}`, { 
            error: error.message 
          });
        }
      }

      logger.info(`Started ${totalBots} bots across ${activeTenants.length} tenants`);
    } catch (error) {
      logger.error('Failed to start tenant bots', { error: error.message });
    }
  }

  async start() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      this.server = this.app.listen(this.port, () => {
        logger.info(`Multi-tenant WhatsDeX server running on port ${this.port}`);
        console.log(`
🚀 Multi-tenant WhatsDeX SaaS Platform is ready!

📊 Server: http://localhost:${this.port}
🌐 Frontend: http://localhost:3000
📋 Health: http://localhost:${this.port}/health

📱 Active tenants: ${this.activeTenants.size}
🤖 Active bots: ${Array.from(this.activeTenants.values())
  .reduce((total, tenant) => total + (tenant.botInstances?.length || 0), 0)}

💡 Demo tenant: demo.whatsdx.com (or localhost with subdomain: demo)
📧 Demo login: admin@demo.com / password123
        `);
      });

      // Graceful shutdown
      process.on('SIGTERM', () => this.shutdown());
      process.on('SIGINT', () => this.shutdown());

    } catch (error) {
      logger.error('Failed to start server', { error: error.message });
      throw error;
    }
  }

  async shutdown() {
    logger.info('Shutting down multi-tenant server...');

    try {
      // Stop all bots
      for (const tenantId of this.activeTenants.keys()) {
        await multiTenantBotService.stopTenantBots(tenantId);
      }

      // Close database connection
      await prisma.$disconnect();

      // Close server
      if (this.server) {
        this.server.close(() => {
          logger.info('Server closed successfully');
          process.exit(0);
        });
      }
    } catch (error) {
      logger.error('Error during shutdown', { error: error.message });
      process.exit(1);
    }
  }

  getApp() {
    return this.app;
  }

  getActiveTenants() {
    return Array.from(this.activeTenants.values());
  }

  async getTenantStats() {
    const stats = {
      totalTenants: this.activeTenants.size,
      totalBots: 0,
      totalUsers: 0,
      totalMessages: 0
    };

    for (const tenant of this.activeTenants.values()) {
      stats.totalBots += tenant.botInstances?.length || 0;
      
      // Get real-time stats from database
      const usage = await multiTenantService.getCurrentUsage(tenant.id, 'maxUsers');
      stats.totalUsers += usage;
    }

    return stats;
  }
}

export default MultiTenantApp;
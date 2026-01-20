import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import logger from '../utils/logger.js';
import { ConfigService } from '../services/ConfigService.js';
import multiTenantService from '../services/multiTenantService.js';
import stripeService from '../services/stripeService.js';
import multiTenantBotService from '../services/multiTenantBotService.js';
import multiTenantRoutes from '../routes/multiTenant.js';
import authRoutes from '../routes/authRoutes.js';
import templateRoutes from '../routes/templateRoutes.js';
import analyticsRoutes from '../routes/analyticsRoutes.js';
import contactRoutes from '../routes/contactRoutes.js';
import messageRoutes from '../routes/messageRoutes.js';
import campaignRoutes from '../routes/campaigns.js';
import webhookRoutes from '../routes/webhookRoutes.js';
import billingRoutes from '../routes/billingRoutes.js';
import stripeWebhookRoutes from '../routes/stripeWebhookRoutes.js';
import tenantSettingsRoutes from '../routes/tenantSettingsRoutes.js';
import AnalyticsService from '../services/analytics.js';
import AuditService from '../services/auditService.js';
import { errorHandler, notFoundHandler } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

export class MultiTenantApp {
  // ... existing code ...
  private app: express.Application;
  private port: number;
  private server: any;
  private activeTenants: Map<string, any>;
  private isInitialized: boolean;
  private config: ConfigService;

  constructor() {
    this.config = ConfigService.getInstance();
    this.app = express();
    this.port = this.config.get('PORT');
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

      // Initialize Analytics (App Port + 1)
      await AnalyticsService.initialize({
        websocketPort: this.port + 1
      });
      logger.info(`Enterprise Analytics Gateway online at port ${this.port + 1}`);

      // Initialize services
      await this.initializeServices();

      // Start active tenant bots
      await this.startActiveTenantBots();

      this.isInitialized = true;
      logger.info('Multi-tenant app initialized successfully');
    } catch (error: any) {
      logger.error('Failed to initialize multi-tenant app', { error: error.message });
      throw error;
    }
  }

  setupMiddleware() {
    // Request Logging
    this.app.use((req, res, next) => {
      logger.info(`INCOMING REQUEST: ${req.method} ${req.url}`);
      next();
    });

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
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        if (!origin ||
          origin.includes('localhost') ||
          origin.endsWith('.whatsdx.com') ||
          origin === this.config.get('NEXT_PUBLIC_APP_URL')) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true
    }));

    // Compression
    this.app.use(compression() as any);

    // Body parsing
    this.app.use(express.json({ 
      limit: '10mb',
      verify: (req: any, res, buf) => {
        req.rawBody = buf;
      }
    }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    this.app.use(cookieParser() as any);

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: this.config.get('RATE_LIMIT_MAX'),
      message: {
        error: 'Too many requests, please try again later.'
      }
    });
    this.app.use('/api/', limiter as any);

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
    // Health check
    // Health check
    this.app.get('/api/health', async (req, res) => {
      res.json({
        status: 'healthy',
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
      });
    });

    // Internal API routes
    this.app.use('/api/internal', authenticateToken, multiTenantRoutes);

    // Public auth routes
    this.app.use('/api/auth', authRoutes);

    // Template routes
    this.app.use('/api/templates', templateRoutes);

    // Analytics routes
    this.app.use('/api/analytics', authenticateToken, analyticsRoutes);

    // Contacts routes
    this.app.use('/api/contacts', authenticateToken, contactRoutes);

    // Messages routes
    this.app.use('/api/messages', authenticateToken, messageRoutes);

    // Campaigns routes
    this.app.use('/api/campaigns', authenticateToken, campaignRoutes);

    // Webhooks routes
    this.app.use('/api/webhooks', authenticateToken, webhookRoutes);

    // Tenant management
    this.app.get('/api/tenants', authenticateToken, async (req, res) => {
      try {
        const tenants = await multiTenantService.listTenants();
        res.json({ success: true, data: tenants });
      } catch (error: any) {
        logger.error('Failed to get tenants', { error: error.message });
        res.status(500).json({ error: 'Failed to get tenants' });
      }
    });

    // Tenant Settings Routes
    this.app.use('/api/tenant', authenticateToken, tenantSettingsRoutes);

    // Billing routes
    this.app.use('/api/billing/webhook', stripeWebhookRoutes);
    this.app.use('/api/billing', authenticateToken, billingRoutes);

    // Bot management
    this.app.post('/api/bots/:botId/start', authenticateToken, async (req, res) => {
      try {
        const botId = req.params.botId as string;
        const tenantId = req.user?.tenantId as string;
        if (!tenantId) throw new Error('Tenant context missing');

        await multiTenantBotService.startBot(tenantId, botId);

        // Audit log
        await AuditService.logEvent({
          eventType: 'BOT_LIFECYCLE',
          actor: 'TENANT_ADMIN',
          actorId: tenantId,
          action: 'START_BOT',
          resource: 'BOT',
          resourceId: botId,
          riskLevel: 'LOW'
        });

        res.json({ success: true, message: 'Bot started successfully' });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/bots/:botId/stop', authenticateToken, async (req, res) => {
      try {
        const botId = req.params.botId as string;
        await multiTenantBotService.stopBot(botId);
        res.json({ success: true, message: 'Bot stopped successfully' });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // ... (rest of bot management routes updated to use multiTenantBotService)

    // Error handling
    this.app.use(errorHandler);

    // 404 handler
    this.app.use(notFoundHandler);
  }

  async initializeServices() {
    try {
      const stripeKey = this.config.get('STRIPE_SECRET_KEY');
      const stripeWebhookSecret = this.config.get('STRIPE_WEBHOOK_SECRET');

      if (stripeKey) {
        await stripeService.initialize(stripeKey, stripeWebhookSecret || '');
        logger.info('Stripe service initialized');
      }
    } catch (error: any) {
      logger.error('Failed to initialize services', { error: error.message });
    }
  }

  async startActiveTenantBots() {
    try {
      logger.info('Starting active tenant bots...');
      // Logic moved to multiTenantBotService
      await multiTenantBotService.startAllBots();
    } catch (error: any) {
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
      });

      process.on('SIGTERM', () => this.shutdown());
      process.on('SIGINT', () => this.shutdown());

    } catch (error: any) {
      logger.error('Failed to start server', { error: error.message });
      throw error;
    }
  }

  async shutdown() {
    logger.info('Shutting down multi-tenant server...');
    try {
      await multiTenantBotService.stopAllBots();
      if (this.server) {
        this.server.close(() => {
          logger.info('Server closed successfully');
          process.exit(0);
        });
      }
    } catch (error: any) {
      logger.error('Error during shutdown', { error: error.message });
      process.exit(1);
    }
  }
}

export default MultiTenantApp;

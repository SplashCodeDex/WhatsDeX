import { createServer, Server as HttpServer } from 'node:http';
import express, { Request, Response, NextFunction } from 'express';
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
import telegramWebhookRoutes from '../routes/telegramWebhookRoutes.js';
import billingRoutes from '../routes/billingRoutes.js';
import omnichannelRoutes from '../routes/omnichannelRoutes.js';
import skillsRoutes from '../routes/skillsRoutes.js';
import flowRoutes from '../routes/flowRoutes.js';
import stripeWebhookRoutes from '../routes/stripeWebhookRoutes.js';
import tenantSettingsRoutes from '../routes/tenantSettingsRoutes.js';
import integrationRoutes from '../routes/integrationRoutes.js';
import logsRoutes from '../routes/logsRoutes.js';
import AnalyticsService from '../services/analytics.js';
import { socketService } from '../services/socketService.js';
import { errorHandler, notFoundHandler } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

export class MultiTenantApp {
  private app: express.Application;
  private httpServer: HttpServer;
  private port: number;
  private isInitialized: boolean;
  private config: ConfigService;

  constructor() {
    this.config = ConfigService.getInstance();
    this.app = express();
    this.httpServer = createServer(this.app);
    this.port = this.config.get('PORT');
    this.isInitialized = false;
  }

  async initialize(): Promise<void> {
    try {
      logger.info('Initializing Multi-tenant WhatsDeX SaaS Platform...');

      logger.info('>>> [MASTERMIND] Setting up server middleware...');
      // Setup middleware
      this.setupMiddleware();

      logger.info('>>> [MASTERMIND] Setting up server routes...');
      // Setup routes
      this.setupRoutes();

      logger.info('>>> [MASTERMIND] Initializing Analytics Service...');
      // Initialize Analytics (App Port + 1)
      await AnalyticsService.initialize({
        websocketPort: this.port + 1
      });
      logger.info(`>>> [MASTERMIND] Enterprise Analytics Gateway online at port ${this.port + 1}`);

      logger.info('>>> [MASTERMIND] Initializing Unified WebSockets...');
      // Initialize Unified WebSockets (Shared Port)
      socketService.initialize(this.httpServer);

      logger.info('>>> [MASTERMIND] Initializing additional services...');
      // Initialize services
      await this.initializeServices();

      logger.info('>>> [MASTERMIND] Starting active tenant bots...');
      // Start active tenant bots
      await this.startActiveTenantBots();

      this.isInitialized = true;
      logger.info('Multi-tenant app initialized successfully');
    } catch (error: unknown) {
      logger.error('Failed to initialize multi-tenant app', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  private setupMiddleware(): void {
    // Request Logging
    this.app.use((req: Request, _res: Response, next: NextFunction) => {
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

    // CORS (2026 Strict Mode)
    this.app.use(cors({
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        const appUrl = this.config.get('NEXT_PUBLIC_APP_URL');
        if (!origin ||
          /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
          /^https?:\/\/([^/]+\.)?whatsdx\.com$/.test(origin) ||
          origin === appUrl) {
          callback(null, true);
        } else {
          logger.warn(`Blocked CORS request from unauthorized origin: ${origin}`);
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true
    }));

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({
      limit: '10mb',
      verify: (req: any, _res: Response, buf: Buffer) => {
        req.rawBody = buf;
      }
    }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    this.app.use(cookieParser());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: this.config.get('RATE_LIMIT_MAX'),
      message: {
        success: false,
        error: 'Too many requests, please try again later.'
      }
    });
    this.app.use('/api/', limiter);

    // Context logging
    this.app.use((req: Request, _res: Response, next: NextFunction) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        tenant: req.headers['x-tenant-id']
      });
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/api/health', (_req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0'
      });
    });

    // Internal API routes
    this.app.use('/api/internal', authenticateToken, multiTenantRoutes);

    // Public auth routes
    this.app.use('/api/auth', authRoutes);

    // Template routes (Protected)
    this.app.use('/api/templates', authenticateToken, templateRoutes);

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
    this.app.use('/api/telegram', telegramWebhookRoutes);

    // Tenant management
    this.app.get('/api/tenants', authenticateToken, async (_req: Request, res: Response) => {
      try {
        const tenants = await multiTenantService.listTenants();
        res.json({ success: true, data: tenants });
      } catch (error: unknown) {
        logger.error('Failed to get tenants', {
          error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({ success: false, error: 'Failed to get tenants' });
      }
    });

    // Omnichannel Routes
    this.app.use('/api/omnichannel', authenticateToken, omnichannelRoutes);

    // Flow Routes
    this.app.use('/api/flows', authenticateToken, flowRoutes);

    // Skills Routes
    this.app.use('/api/skills', authenticateToken, skillsRoutes);

    // Tenant Settings Routes
    this.app.use('/api/tenant', authenticateToken, tenantSettingsRoutes);

    // Integations Routes
    this.app.use('/api/integrations', integrationRoutes);

    // Billing routes
    this.app.use('/api/billing/webhook', stripeWebhookRoutes);
    this.app.use('/api/billing', authenticateToken, billingRoutes);

    // Client Logs
    this.app.use('/api/logs', logsRoutes);

    // 404 handler
    this.app.use(notFoundHandler);

    // Error handling (MUST be last)
    this.app.use(errorHandler);
  }

  private async initializeServices(): Promise<void> {
    try {
      const stripeKey = this.config.get('STRIPE_SECRET_KEY');
      const stripeWebhookSecret = this.config.get('STRIPE_WEBHOOK_SECRET');

      if (stripeKey) {
        await stripeService.initialize(stripeKey, stripeWebhookSecret || '');
        logger.info('Stripe service initialized');
      }
    } catch (error: unknown) {
      logger.error('Failed to initialize services', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async startActiveTenantBots(): Promise<void> {
    try {
      logger.info('Starting active tenant bots...');
      await multiTenantBotService.startAllBots();
    } catch (error: unknown) {
      logger.error('Failed to start tenant bots', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  async start(): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      logger.info(`>>> [MASTERMIND] Attempting to listen on port ${this.port}...`);
      this.httpServer.listen(this.port, () => {
        logger.info(`>>> [MASTERMIND] Multi-tenant WhatsDeX server running on port ${this.port}`);
      });

      process.on('SIGTERM', () => this.shutdown());
      process.on('SIGINT', () => this.shutdown());

    } catch (error: unknown) {
      logger.error('Failed to start server', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down multi-tenant server...');
    try {
      await multiTenantBotService.stopAllBots();
      if (this.httpServer) {
        this.httpServer.close(() => {
          logger.info('Server closed successfully');
          process.exit(0);
        });
      }
    } catch (error: unknown) {
      logger.error('Error during shutdown', {
        error: error instanceof Error ? error.message : String(error)
      });
      process.exit(1);
    }
  }
}

export default MultiTenantApp;

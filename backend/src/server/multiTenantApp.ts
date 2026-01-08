import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import http from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import logger from '../utils/logger';
import multiTenantService from '../services/multiTenantService';
import multiTenantStripeService from '../services/multiTenantStripeService';
import multiTenantBotService from '../services/multiTenantBotService';
import multiTenantRoutes from '../routes/multiTenant';
import authRoutes from '../routes/auth';
import templateRoutes from '../routes/templateRoutes';
import { errorHandler, notFoundHandler } from '../middleware/errorHandler';
import { initializeSocketIO } from '../app';

export class MultiTenantApp {
  public app: express.Application;
  public port: number | string;
  public server: http.Server;
  public io: SocketIOServer;
  private activeTenants: Map<string, any>;
  private isInitialized: boolean;

  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3001;
    this.server = http.createServer(this.app);
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

      // Initialize Socket.IO
      this.io = initializeSocketIO(this.server);
      logger.info('Socket.IO initialized');

      // Initialize services
      await this.initializeServices();
      multiTenantBotService.initialize(this.io);

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
    this.app.use(cookieParser());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
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
    // Health check
    this.app.get('/health', async (req, res) => {
      res.json({
        status: 'healthy',
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
      });
    });

    // Internal API routes
    this.app.use('/api/internal', multiTenantRoutes);

    // Public auth routes
    // Public auth routes
    this.app.use('/api/auth', authRoutes);

    // Template routes
    this.app.use('/api/templates', templateRoutes);

    // Tenant management
    this.app.get('/api/tenants', async (req, res) => {
      try {
        const tenants = await multiTenantService.listTenants();
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
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/bots/:botId/stop', async (req, res) => {
      try {
        const { botId } = req.params;
        await multiTenantBotService.stopBot(botId);
        res.json({ success: true, message: 'Bot stopped successfully' });
      } catch (error) {
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
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (stripeKey) {
        await multiTenantStripeService.initialize(stripeKey, stripeWebhookSecret);
        logger.info('Stripe service initialized');
      }
    } catch (error) {
      logger.error('Failed to initialize services', { error: error.message });
    }
  }

  async startActiveTenantBots() {
    try {
      logger.info('Starting active tenant bots...');
      // Logic moved to multiTenantBotService
      await multiTenantBotService.startAllBots();
    } catch (error) {
      logger.error('Failed to start tenant bots', { error: error.message });
    }
  }

  async start() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      this.server.listen(this.port, () => {
        logger.info(`Multi-tenant WhatsDeX server running on port ${this.port}`);
      });

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
      await multiTenantBotService.stopAllBots();
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
}

export default MultiTenantApp;

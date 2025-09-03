const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Import context and services
const context = require('./context.js');
const { config, consolefy, auditLogger } = context;

// Import routes
const userRoutes = require('./routes/users');
const settingsRoutes = require('./routes/settings');
const auditRoutes = require('./routes/audit');
const moderationRoutes = require('./routes/moderation');
const analyticsRoutes = require('./routes/analytics');

// Import middleware
const authMiddleware = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');

class AdminServer {
  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: process.env.NODE_ENV === 'development' ? '*' : process.env.FRONTEND_URL,
        methods: ['GET', 'POST']
      }
    });

    this.port = process.env.ADMIN_PORT || 3001;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Initialize context services first
      await context.initialize();

      // Security middleware
      this.app.use(helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
          },
        },
      }));

      // CORS configuration
      this.app.use(cors({
        origin: process.env.NODE_ENV === 'development' ? '*' : process.env.FRONTEND_URL,
        credentials: true
      }));

      // Compression
      this.app.use(compression());

      // Rate limiting
      const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
      });
      this.app.use('/api/', limiter);

      // Body parsing
      this.app.use(express.json({ limit: '10mb' }));
      this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

      // Static files for admin dashboard
      this.app.use(express.static(path.join(__dirname, 'admin')));

      // API routes
      this.app.use('/api/users', authMiddleware.authenticateToken, userRoutes);
      this.app.use('/api/settings', authMiddleware.authenticateToken, settingsRoutes);
      this.app.use('/api/audit', authMiddleware.authenticateToken, auditRoutes);
      this.app.use('/api/moderation', authMiddleware.authenticateToken, moderationRoutes);
      this.app.use('/api/analytics', authMiddleware.authenticateToken, analyticsRoutes);

      // Health check endpoint
      this.app.get('/health', (req, res) => {
        res.json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime()
        });
      });

      // Serve admin dashboard
      this.app.get('/admin/*', (req, res) => {
        res.sendFile(path.join(__dirname, 'admin', 'index.html'));
      });

      // Error handling middleware
      this.app.use(errorHandler);

      // WebSocket setup
      this.setupWebSocket();

      this.isInitialized = true;
      consolefy.success(`Admin server initialized on port ${this.port}`);

    } catch (error) {
      consolefy.error(`Failed to initialize admin server: ${error.message}`);
      throw error;
    }
  }

  setupWebSocket() {
    this.io.on('connection', (socket) => {
      consolefy.log(`WebSocket client connected: ${socket.id}`);

      // Join admin room for real-time updates
      socket.join('admin');

      socket.on('disconnect', () => {
        consolefy.log(`WebSocket client disconnected: ${socket.id}`);
      });
    });
  }

  broadcast(event, data) {
    this.io.to('admin').emit(event, data);
  }

  async start() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      this.server.listen(this.port, (error) => {
        if (error) {
          consolefy.error(`Failed to start admin server: ${error.message}`);
          reject(error);
        } else {
          consolefy.success(`Admin server running on port ${this.port}`);
          resolve();
        }
      });
    });
  }

  async stop() {
    return new Promise((resolve) => {
      this.server.close(() => {
        consolefy.log('Admin server stopped');
        resolve();
      });
    });
  }

  getApp() {
    return this.app;
  }

  getIO() {
    return this.io;
  }
}

// Export singleton instance
module.exports = new AdminServer();
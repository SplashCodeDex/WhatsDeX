const Sentry = require('@sentry/node');
const logger = require('../utils/logger');

class ErrorHandler {
  constructor() {
    this.isInitialized = false;
    this.errorCounts = new Map();
    this.errorThreshold = 10; // Max errors per minute before alerting
    this.alertCooldown = 5 * 60 * 1000; // 5 minutes cooldown between alerts
    this.lastAlertTime = 0;
  }

  initialize() {
    if (this.isInitialized) return;

    // Initialize Sentry if DSN is provided
    if (process.env.SENTRY_DSN) {
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: 1.0,
        integrations: [
          new Sentry.Integrations.Http({ tracing: true }),
          new Sentry.Integrations.Console(),
        ],
        beforeSend: (event) => {
          // Add custom context
          event.tags = {
            ...event.tags,
            service: 'whatsdex',
            version: process.env.npm_package_version || '1.0.0'
          };
          return event;
        }
      });

      logger.info('Sentry error tracking initialized');
    }

    this.isInitialized = true;
  }

  // Main error handling method
  handle(error, context = {}) {
    const errorId = this.generateErrorId(error);
    const errorInfo = this.parseError(error, context);

    // Log the error
    logger.error(`Error handled: ${errorInfo.message}`, {
      errorId,
      stack: errorInfo.stack,
      context,
      userId: context.userId,
      command: context.command,
      groupId: context.groupId
    });

    // Send to Sentry if available
    if (process.env.SENTRY_DSN) {
      Sentry.withScope((scope) => {
        scope.setTag('errorId', errorId);
        scope.setTag('service', 'whatsdex');

        if (context.userId) scope.setUser({ id: context.userId });
        if (context.command) scope.setTag('command', context.command);
        if (context.groupId) scope.setTag('groupId', context.groupId);

        scope.setContext('error_context', context);
        scope.setContext('error_info', errorInfo);

        Sentry.captureException(error);
      });
    }

    // Track error frequency for alerting
    this.trackErrorFrequency(errorInfo.type);

    // Return error response
    return {
      success: false,
      error: {
        id: errorId,
        message: this.getUserFriendlyMessage(errorInfo),
        type: errorInfo.type,
        recoverable: this.isRecoverable(errorInfo)
      }
    };
  }

  // Handle async errors
  async handleAsync(fn, context = {}) {
    try {
      return await fn();
    } catch (error) {
      return this.handle(error, context);
    }
  }

  // Parse error into structured format
  parseError(error, context = {}) {
    const parsed = {
      message: error.message || 'Unknown error',
      stack: error.stack,
      type: this.classifyError(error),
      code: error.code,
      errno: error.errno,
      syscall: error.syscall,
      originalError: error
    };

    // Add context-specific information
    if (context.command) {
      parsed.command = context.command;
    }

    if (context.userId) {
      parsed.userId = context.userId;
    }

    return parsed;
  }

  // Classify error types
  classifyError(error) {
    if (error.code === 'ECONNREFUSED') return 'connection';
    if (error.code === 'ENOTFOUND') return 'network';
    if (error.code === 'EACCES') return 'permission';
    if (error.code === 'ENOENT') return 'file_not_found';
    if (error.name === 'ValidationError') return 'validation';
    if (error.name === 'CastError') return 'database_cast';
    if (error.name === 'MongoError' || error.name === 'PrismaClientKnownRequestError') return 'database';
    if (error.message?.includes('rate limit')) return 'rate_limit';
    if (error.message?.includes('API key')) return 'api_key';
    if (error.message?.includes('timeout')) return 'timeout';

    return 'unknown';
  }

  // Generate unique error ID
  generateErrorId(error) {
    const timestamp = Date.now();
    const hash = require('crypto').createHash('md5');
    hash.update(`${timestamp}-${error.message}-${error.stack}`);
    return `err_${hash.digest('hex').substring(0, 8)}`;
  }

  // Get user-friendly error messages
  getUserFriendlyMessage(errorInfo) {
    const messages = {
      connection: 'Unable to connect to the service. Please try again later.',
      network: 'Network connection issue. Please check your internet connection.',
      permission: 'Permission denied. Please contact support if this persists.',
      file_not_found: 'Required file not found. Please try again.',
      validation: 'Invalid input provided. Please check your command format.',
      database: 'Database temporarily unavailable. Please try again later.',
      rate_limit: 'Too many requests. Please wait a moment before trying again.',
      api_key: 'Service temporarily unavailable. Please try again later.',
      timeout: 'Request timed out. Please try again.',
      unknown: 'An unexpected error occurred. Please try again or contact support.'
    };

    return messages[errorInfo.type] || messages.unknown;
  }

  // Check if error is recoverable
  isRecoverable(errorInfo) {
    const recoverableTypes = ['connection', 'network', 'timeout', 'rate_limit'];
    return recoverableTypes.includes(errorInfo.type);
  }

  // Track error frequency for alerting
  trackErrorFrequency(errorType) {
    const now = Date.now();
    const key = `${errorType}_${Math.floor(now / 60000)}`; // Per minute

    const currentCount = this.errorCounts.get(key) || 0;
    this.errorCounts.set(key, currentCount + 1);

    // Clean up old entries
    for (const [k, v] of this.errorCounts.entries()) {
      if (now - parseInt(k.split('_')[1]) * 60000 > 3600000) { // Older than 1 hour
        this.errorCounts.delete(k);
      }
    }

    // Alert if threshold exceeded
    if (currentCount + 1 >= this.errorThreshold && now - this.lastAlertTime > this.alertCooldown) {
      logger.warn(`High error frequency detected for type: ${errorType}`, {
        count: currentCount + 1,
        threshold: this.errorThreshold
      });
      this.lastAlertTime = now;
    }
  }

  // Create error boundary for Express routes
  createErrorBoundary() {
    return (error, req, res, next) => {
      const errorResponse = this.handle(error, {
        userId: req.user?.id,
        command: req.body?.command,
        method: req.method,
        url: req.url
      });

      res.status(this.getHttpStatusCode(error)).json(errorResponse);
    };
  }

  // Get appropriate HTTP status code for error
  getHttpStatusCode(error) {
    const errorType = this.classifyError(error);

    const statusCodes = {
      connection: 503,
      network: 502,
      permission: 403,
      file_not_found: 404,
      validation: 400,
      database: 503,
      rate_limit: 429,
      api_key: 503,
      timeout: 408,
      unknown: 500
    };

    return statusCodes[errorType] || 500;
  }

  // Health check
  async healthCheck() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'error-handler',
      sentry: process.env.SENTRY_DSN ? 'configured' : 'not_configured'
    };
  }
}

module.exports = ErrorHandler;
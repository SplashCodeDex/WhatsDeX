/**
 * Centralized Error Handling Service
 * Provides consistent error handling across the application
 */

const logger = require('../utils/logger');

class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}

class ErrorHandler {
  constructor() {
    this.errorTypes = {
      VALIDATION_ERROR: 'ValidationError',
      DATABASE_ERROR: 'DatabaseError',
      NETWORK_ERROR: 'NetworkError',
      AUTHENTICATION_ERROR: 'AuthenticationError',
      AUTHORIZATION_ERROR: 'AuthorizationError',
      NOT_FOUND_ERROR: 'NotFoundError',
      RATE_LIMIT_ERROR: 'RateLimitError',
      EXTERNAL_API_ERROR: 'ExternalApiError',
    };
  }

  /**
   * Handle operational errors
   */
  handleOperationalError(error, context = {}) {
    logger.error('Operational Error:', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    });

    // Don't expose internal errors to users
    const userMessage = this.getUserFriendlyMessage(error);
    return { success: false, message: userMessage, error: error.message };
  }

  /**
   * Handle programming errors (bugs)
   */
  handleProgrammingError(error, context = {}) {
    logger.error('Programming Error:', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    });

    // For programming errors, we might want to exit the process
    // in development, but handle gracefully in production
    if (process.env.NODE_ENV === 'production') {
      // Log and continue
      return { success: false, message: 'An unexpected error occurred' };
    }
    // In development, throw to get full stack trace
    throw error;
  }

  /**
   * Handle database errors
   */
  handleDatabaseError(error, operation = 'unknown') {
    logger.error('Database Error:', {
      operation,
      message: error.message,
      code: error.code,
      meta: error.meta,
      timestamp: new Date().toISOString(),
    });

    // Handle specific database errors
    if (error.code === 'P1001') {
      return { success: false, message: 'Database connection failed' };
    }

    if (error.code === 'P2002') {
      return { success: false, message: 'Data already exists' };
    }

    return { success: false, message: 'Database operation failed' };
  }

  /**
   * Handle API errors
   */
  handleApiError(error, service = 'unknown') {
    logger.error('API Error:', {
      service,
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      timestamp: new Date().toISOString(),
    });

    const status = error.response?.status;
    if (status === 401) {
      return { success: false, message: 'Authentication failed' };
    }

    if (status === 403) {
      return { success: false, message: 'Access forbidden' };
    }

    if (status === 429) {
      return { success: false, message: 'Rate limit exceeded' };
    }

    return { success: false, message: `Service ${service} unavailable` };
  }

  /**
   * Handle WhatsApp-specific errors
   */
  handleWhatsAppError(error, operation = 'unknown') {
    logger.error('WhatsApp Error:', {
      operation,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    // Handle specific WhatsApp errors
    if (error.message?.includes('connection')) {
      return { success: false, message: 'WhatsApp connection failed' };
    }

    if (error.message?.includes('auth')) {
      return { success: false, message: 'WhatsApp authentication failed' };
    }

    return { success: false, message: 'WhatsApp operation failed' };
  }

  /**
   * Get user-friendly error message
   */
  getUserFriendlyMessage(error) {
    // Map technical errors to user-friendly messages
    const errorMappings = {
      ENOTFOUND: 'Service temporarily unavailable',
      ECONNREFUSED: 'Connection failed',
      ETIMEDOUT: 'Request timed out',
      EACCES: 'Permission denied',
      ENOENT: 'Resource not found',
    };

    const technicalCode = error.code || error.errno;
    if (technicalCode && errorMappings[technicalCode]) {
      return errorMappings[technicalCode];
    }

    // For unknown errors, provide generic message
    if (process.env.NODE_ENV === 'production') {
      return 'An error occurred. Please try again later.';
    }

    // In development, show the actual error
    return error.message || 'An unexpected error occurred';
  }

  /**
   * Create standardized error response
   */
  createErrorResponse(error, context = {}) {
    const baseResponse = {
      success: false,
      timestamp: new Date().toISOString(),
      context,
    };

    if (error instanceof AppError) {
      return {
        ...baseResponse,
        message: error.message,
        statusCode: error.statusCode,
        type: 'AppError',
      };
    }

    // Handle different error types
    if (error.name === 'ValidationError') {
      return {
        ...baseResponse,
        message: 'Invalid input data',
        statusCode: 400,
        type: 'ValidationError',
        details: error.details,
      };
    }

    if (error.name === 'CastError') {
      return {
        ...baseResponse,
        message: 'Invalid data format',
        statusCode: 400,
        type: 'CastError',
      };
    }

    // Default error response
    return {
      ...baseResponse,
      message: this.getUserFriendlyMessage(error),
      statusCode: 500,
      type: 'UnknownError',
    };
  }

  /**
   * Async error wrapper for routes/controllers
   */
  asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(error => {
        const errorResponse = this.createErrorResponse(error, {
          url: req.url,
          method: req.method,
          ip: req.ip,
        });

        logger.error('Unhandled async error:', error);

        res.status(errorResponse.statusCode).json(errorResponse);
      });
    };
  }

  /**
   * WhatsApp command error wrapper
   */
  commandHandler(fn) {
    return async ctx => {
      try {
        return await fn(ctx);
      } catch (error) {
        logger.error('Command error:', {
          command: ctx.used?.command,
          user: ctx.getId(ctx.sender.jid),
          error: error.message,
          stack: error.stack,
        });

        const errorResponse = this.handleOperationalError(error, {
          command: ctx.used?.command,
          user: ctx.getId(ctx.sender.jid),
        });

        return ctx.reply(errorResponse.message);
      }
    };
  }

  /**
   * Database operation wrapper
   */
  databaseHandler(fn) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        return this.handleDatabaseError(error, fn.name);
      }
    };
  }

  /**
   * API call wrapper
   */
  apiHandler(fn, serviceName) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        return this.handleApiError(error, serviceName);
      }
    };
  }
}

// Create singleton instance
const errorHandler = new ErrorHandler();

// Export both class and instance
module.exports = errorHandler;
module.exports.AppError = AppError;
module.exports.ErrorHandler = ErrorHandler;

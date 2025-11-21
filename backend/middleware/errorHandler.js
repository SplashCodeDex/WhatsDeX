import logger from '../src/utils/logger.js';

/**
 * Global error handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    body: req.method !== 'GET' ? req.body : undefined,
    query: req.query,
    params: req.params,
  });

  // Determine error type and status code
  let statusCode = 500;
  let errorCode = 'INTERNAL_ERROR';
  let message = 'Internal server error';

  if (err.name === 'ValidationError') {
    // Zod validation error
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = 'Invalid request data';
  } else if (err.name === 'UnauthorizedError') {
    // JWT error
    statusCode = 401;
    errorCode = 'AUTH_ERROR';
    message = 'Authentication failed';
  } else if (err.code === 'P2002') {
    // Prisma unique constraint error
    statusCode = 409;
    errorCode = 'CONFLICT_ERROR';
    message = 'Resource already exists';
  } else if (err.code === 'P2025') {
    // Prisma not found error
    statusCode = 404;
    errorCode = 'NOT_FOUND';
    message = 'Resource not found';
  } else if (err.message.includes('rate limit')) {
    statusCode = 429;
    errorCode = 'RATE_LIMIT_ERROR';
    message = 'Too many requests';
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Something went wrong';
  }

  // Send error response
  res.status(statusCode).json({
    error: message,
    code: errorCode,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err.message,
    }),
  });
};

/**
 * Async error wrapper for route handlers
 */
export const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Enhanced Custom Error Classes (consolidated from errors/index.js)
 */

/**
 * Base Application Error
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_ERROR', details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: this.name,
      message: this.message,
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      details: this.details,
      timestamp: this.timestamp,
    };
  }
}

/**
 * Validation Error (400)
 */
export class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 400, 'VALIDATION_ERROR', { field });
    this.field = field;
  }
}

/**
 * Authentication Error (401)
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTH_ERROR');
  }
}

/**
 * Authorization Error (403)
 */
export class AuthorizationError extends AppError {
  constructor(message = 'Permission denied', resource = null) {
    super(message, 403, 'AUTH_FORBIDDEN', { resource });
  }
}

/**
 * Not Found Error (404)
 */
export class NotFoundError extends AppError {
  constructor(resource = 'Resource', id = null) {
    const message = id ? `${resource} with ID '${id}' not found` : `${resource} not found`;
    super(message, 404, 'NOT_FOUND', { resource, id });
  }
}

/**
 * Conflict Error (409)
 */
export class ConflictError extends AppError {
  constructor(message, resource = null) {
    super(message, 409, 'CONFLICT_ERROR', { resource });
  }
}

/**
 * Rate Limit Error (429)
 */
export class RateLimitError extends AppError {
  constructor(retryAfter = 60) {
    super('Too many requests. Please try again later.', 429, 'RATE_LIMIT_ERROR', { retryAfter });
    this.retryAfter = retryAfter;
  }
}

/**
 * Database Error (500)
 */
export class DatabaseError extends AppError {
  constructor(operation, details = null) {
    const message = details ? `Database ${operation} failed: ${details}` : `Database ${operation} failed`;
    super(message, 500, 'DATABASE_ERROR', { operation, details });
  }
}

/**
 * External API Error (502)
 */
export class ExternalAPIError extends AppError {
  constructor(service, statusCode = null, message = null) {
    const errorMessage = message || `External service '${service}' is unavailable`;
    super(errorMessage, 502, 'EXTERNAL_API_ERROR', { service, externalStatusCode: statusCode });
  }
}

/**
 * Command Error (Bot-specific)
 */
export class CommandError extends AppError {
  constructor(commandName, reason, statusCode = 400) {
    super(`Command '${commandName}' failed: ${reason}`, statusCode, 'COMMAND_ERROR', {
      commandName,
      reason,
    });
  }
}

/**
 * Validation error handler
 */
export const handleValidationError = error => {
  if (error.name === 'ZodError') {
    const errors = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    }));

    return new AppError('Validation failed', 400, 'VALIDATION_ERROR', { errors });
  }

  return error;
};

/**
 * Database error handler
 */
export const handleDatabaseError = error => {
  if (error.code === 'P2002') {
    return new AppError('Resource already exists', 409, 'CONFLICT_ERROR');
  }

  if (error.code === 'P2025') {
    return new AppError('Resource not found', 404, 'NOT_FOUND');
  }

  if (error.code === 'P1001') {
    return new AppError('Database connection failed', 503, 'DATABASE_ERROR');
  }

  return new AppError('Database operation failed', 500, 'DATABASE_ERROR');
};

/**
 * Authentication error handler
 */
export const handleAuthError = error => {
  if (error.name === 'JsonWebTokenError') {
    return new AppError('Invalid token', 401, 'AUTH_TOKEN_INVALID');
  }

  if (error.name === 'TokenExpiredError') {
    return new AppError('Token expired', 401, 'AUTH_TOKEN_EXPIRED');
  }

  return new AppError('Authentication failed', 401, 'AUTH_ERROR');
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404, 'NOT_FOUND');
  next(error);
};

/**
 * Health check error handler
 */
export const handleHealthCheck = (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0',
  });
};

/**
 * Format WhatsApp-friendly error messages
 */
export const formatWhatsAppError = (error) => {
  const emoji = {
    ValidationError: '⚠️',
    NotFoundError: '🔍',
    AuthenticationError: '🔒',
    AuthorizationError: '🚫',
    RateLimitError: '⏱️',
    DatabaseError: '💾',
    ExternalAPIError: '🌐',
    CommandError: '❌',
    ConflictError: '⚠️',
  };

  const icon = emoji[error.name] || '❗';
  return `${icon} *Error*\n\n${error.message}`;
};

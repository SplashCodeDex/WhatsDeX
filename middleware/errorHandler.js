const logger = require('../src/utils/logger');

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
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
const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Create custom error class
 */
class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error handler
 */
const handleValidationError = error => {
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
const handleDatabaseError = error => {
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
const handleAuthError = error => {
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
const notFoundHandler = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404, 'NOT_FOUND');
  next(error);
};

/**
 * Health check error handler
 */
const handleHealthCheck = (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0',
  });
};

module.exports = {
  errorHandler,
  asyncHandler,
  AppError,
  handleValidationError,
  handleDatabaseError,
  handleAuthError,
  notFoundHandler,
  handleHealthCheck,
};

/**
 * Custom Error Classes for WhatsDeX
 * Standardized English error messages with proper HTTP status codes
 */

/**
 * Base Application Error
 * All custom errors extend from this
 */
class ApplicationError extends Error {
  constructor(message, statusCode = 500, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: this.name,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
    };
  }
}

/**
 * Validation Error (400)
 * Used for invalid user input
 */
class ValidationError extends ApplicationError {
  constructor(message, field = null) {
    super(message, 400, { field });
    this.field = field;
  }
}

/**
 * Authentication Error (401)
 * Used for authentication failures
 */
class AuthenticationError extends ApplicationError {
  constructor(message = 'Authentication required') {
    super(message, 401);
  }
}

/**
 * Authorization Error (403)
 * Used for permission denied scenarios
 */
class AuthorizationError extends ApplicationError {
  constructor(message = 'Permission denied', resource = null) {
    super(message, 403, { resource });
  }
}

/**
 * Not Found Error (404)
 * Used when resources are not found
 */
class NotFoundError extends ApplicationError {
  constructor(resource = 'Resource', id = null) {
    const message = id ? `${resource} with ID '${id}' not found` : `${resource} not found`;
    super(message, 404, { resource, id });
  }
}

/**
 * Conflict Error (409)
 * Used for duplicate entries or conflicts
 */
class ConflictError extends ApplicationError {
  constructor(message, resource = null) {
    super(message, 409, { resource });
  }
}

/**
 * Rate Limit Error (429)
 * Used when rate limits are exceeded
 */
class RateLimitError extends ApplicationError {
  constructor(retryAfter = 60) {
    super('Too many requests. Please try again later.', 429, { retryAfter });
    this.retryAfter = retryAfter;
  }
}

/**
 * Database Error (500)
 * Used for database operation failures
 */
class DatabaseError extends ApplicationError {
  constructor(operation, details = null) {
    const message = details
      ? `Database ${operation} failed: ${details}`
      : `Database ${operation} failed`;
    super(message, 500, { operation, details });
  }
}

/**
 * External API Error (502)
 * Used when external services fail
 */
class ExternalAPIError extends ApplicationError {
  constructor(service, statusCode = null, message = null) {
    const errorMessage = message || `External service '${service}' is unavailable`;
    super(errorMessage, 502, { service, externalStatusCode: statusCode });
  }
}

/**
 * Service Unavailable Error (503)
 * Used for temporary service outages
 */
class ServiceUnavailableError extends ApplicationError {
  constructor(message = 'Service temporarily unavailable', retryAfter = 300) {
    super(message, 503, { retryAfter });
    this.retryAfter = retryAfter;
  }
}

/**
 * Command Error
 * Specific to bot command failures
 */
class CommandError extends ApplicationError {
  constructor(commandName, reason, statusCode = 400) {
    super(`Command '${commandName}' failed: ${reason}`, statusCode, {
      commandName,
      reason,
    });
  }
}

/**
 * Media Processing Error
 * Used for media conversion/processing failures
 */
class MediaProcessingError extends ApplicationError {
  constructor(operation, mediaType, reason = null) {
    const message = reason
      ? `${operation} failed for ${mediaType}: ${reason}`
      : `${operation} failed for ${mediaType}`;
    super(message, 500, { operation, mediaType, reason });
  }
}

/**
 * Content Moderation Error
 * Used when content violates policies
 */
class ContentModerationError extends ApplicationError {
  constructor(reason, severity = 'medium') {
    super(`Content blocked: ${reason}`, 403, { reason, severity });
  }
}

/**
 * Express Error Handler Middleware
 * Centralized error handling for Express routes
 */
function errorHandler(err, req, res, next) {
  // Log error for monitoring
  console.error('[ERROR]', {
    name: err.name,
    message: err.message,
    statusCode: err.statusCode || 500,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Handle Prisma errors
  if (err.code && err.code.startsWith('P')) {
    return res.status(500).json({
      error: 'DatabaseError',
      message: 'Database operation failed',
      statusCode: 500,
    });
  }

  // Handle validation errors from express-validator
  if (err.array && typeof err.array === 'function') {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'Invalid input data',
      errors: err.array(),
      statusCode: 400,
    });
  }

  // Handle custom application errors
  if (err instanceof ApplicationError) {
    return res.status(err.statusCode).json(err.toJSON());
  }

  // Handle unknown errors
  res.status(500).json({
    error: 'InternalServerError',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
    statusCode: 500,
  });
}

/**
 * Async Route Handler Wrapper
 * Automatically catches async errors and passes to error handler
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Create user-friendly error messages for WhatsApp
 */
function formatWhatsAppError(error) {
  const emoji = {
    ValidationError: '⚠️',
    NotFoundError: '🔍',
    AuthenticationError: '🔒',
    AuthorizationError: '🚫',
    RateLimitError: '⏱️',
    DatabaseError: '💾',
    ExternalAPIError: '🌐',
    CommandError: '❌',
    MediaProcessingError: '🎬',
    ContentModerationError: '🛡️',
  };

  const icon = emoji[error.name] || '❗';

  return `${icon} *Error*\n\n${error.message}`;
}

module.exports = {
  // Error Classes
  ApplicationError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalAPIError,
  ServiceUnavailableError,
  CommandError,
  MediaProcessingError,
  ContentModerationError,

  // Middleware
  errorHandler,
  asyncHandler,

  // Utilities
  formatWhatsAppError,
};

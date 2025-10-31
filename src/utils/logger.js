const path = require('path');

const winston = require('winston');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Define the format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
);

// Define which logs to show based on environment
const showLogs =
  process.env.NODE_ENV === 'production'
    ? ['error', 'warn', 'info']
    : ['error', 'warn', 'info', 'http', 'debug'];

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format,
  transports: [
    // Console transport for development
    new winston.transports.Console({
      level: 'debug',
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),

    // File transport for all logs
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'app.log'),
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
    }),

    // Separate file for errors
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
    }),

    // HTTP requests log
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'http.log'),
      level: 'http',
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    }),
  ],
});

// Create logs directory if it doesn't exist
const fs = require('fs');

const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Enhanced logger with additional methods
const enhancedLogger = {
  // Standard logging methods
  error: (message, meta = {}) => {
    logger.error(message, meta);
  },

  warn: (message, meta = {}) => {
    logger.warn(message, meta);
  },

  info: (message, meta = {}) => {
    logger.info(message, meta);
  },

  http: (message, meta = {}) => {
    logger.http(message, meta);
  },

  debug: (message, meta = {}) => {
    logger.debug(message, meta);
  },

  // Specialized methods for bot operations
  command: (command, userId, success = true, executionTime = null, error = null) => {
    const level = success ? 'info' : 'error';
    const message = `Command: ${command} | User: ${userId} | Success: ${success}`;
    const meta = {
      command,
      userId,
      success,
      executionTime,
      error: error?.message || null,
      stack: error?.stack || null,
    };

    logger.log(level, message, meta);
  },

  userActivity: (userId, action, details = {}) => {
    const message = `User Activity: ${action} | User: ${userId}`;
    logger.info(message, { userId, action, ...details });
  },

  groupActivity: (groupId, action, userId, details = {}) => {
    const message = `Group Activity: ${action} | Group: ${groupId} | User: ${userId}`;
    logger.info(message, { groupId, userId, action, ...details });
  },

  apiRequest: (method, url, statusCode, responseTime, userId = null) => {
    const message = `${method} ${url} ${statusCode} ${responseTime}ms`;
    const meta = {
      method,
      url,
      statusCode,
      responseTime,
      userId,
    };

    const level = statusCode >= 400 ? 'warn' : 'http';
    logger.log(level, message, meta);
  },

  performance: (operation, duration, metadata = {}) => {
    const message = `Performance: ${operation} took ${duration}ms`;
    logger.info(message, { operation, duration, ...metadata });
  },

  security: (event, userId = null, details = {}) => {
    const message = `Security Event: ${event}`;
    logger.warn(message, { userId, event, ...details });
  },

  // Method to log with context
  withContext: context => ({
    error: (message, meta = {}) => enhancedLogger.error(message, { ...context, ...meta }),
    warn: (message, meta = {}) => enhancedLogger.warn(message, { ...context, ...meta }),
    info: (message, meta = {}) => enhancedLogger.info(message, { ...context, ...meta }),
    debug: (message, meta = {}) => enhancedLogger.debug(message, { ...context, ...meta }),
    command: (command, userId, success, executionTime, error) =>
      enhancedLogger.command(command, userId, success, executionTime, error),
  }),

  // Stream for Morgan HTTP logging
  stream: {
    write: message => {
      logger.http(message.trim());
    },
  },
};

module.exports = enhancedLogger;

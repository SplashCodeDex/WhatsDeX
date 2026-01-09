import path from 'path';
import winston from 'winston';

import fs from 'fs';
import { SERVER_CONFIG } from '../config/constants.js';


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

// Create the logger
const logger = winston.createLogger({
  level: SERVER_CONFIG.LOG_LEVEL,
  levels,
  format,
  transports: [
    // Console transport (keep production look: info/warn/error)
    new winston.transports.Console({
      level: process.env.CONSOLE_LOG_LEVEL || 'info',
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),

    // File transport for all logs (capture debug and above)
    new winston.transports.File({
      filename: path.join(process.cwd(), SERVER_CONFIG.LOG_DIR, 'app.log'),
      level: 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
    }),

    // Separate file for errors
    new winston.transports.File({
      filename: path.join(process.cwd(), SERVER_CONFIG.LOG_DIR, 'error.log'),
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
    }),

    // HTTP requests log
    new winston.transports.File({
      filename: path.join(process.cwd(), SERVER_CONFIG.LOG_DIR, 'http.log'),
      level: 'http',
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    }),
  ],
});

// Asynchronously create logs directory if it doesn't exist
(async () => {
  try {
    const logsDir = path.join(process.cwd(), SERVER_CONFIG.LOG_DIR);
    await fs.promises.mkdir(logsDir, { recursive: true });
  } catch (error: any) {
    // This error is not critical, but should be logged to the console.
    console.error('❌ Warning: Failed to create logs directory:', error);
  }
})();

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
    // pino/baileys compatibility: trace maps to debug
    trace: (message, meta = {}) => enhancedLogger.debug(message, { ...context, ...meta }),
    command: (command, userId, success, executionTime, error) =>
      enhancedLogger.command(command, userId, success, executionTime, error),
  }),

  // pino compatibility at root level
  trace: (message, meta = {}) => enhancedLogger.debug(message, meta),

  // Compatibility shim for libraries expecting pino-like child()
  child: (meta = {}) => enhancedLogger.withContext(meta),

  // Stream for Morgan HTTP logging
  stream: {
    write: message => {
      logger.http(message.trim());
    },
  },
};

// Export enhanced logger
export { enhancedLogger as logger };
export default enhancedLogger;

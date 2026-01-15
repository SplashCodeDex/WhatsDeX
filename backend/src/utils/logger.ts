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
const winstonLogger = winston.createLogger({
  level: SERVER_CONFIG.LOG_LEVEL,
  levels,
  format,
  transports: [
    new winston.transports.Console({
      level: process.env.CONSOLE_LOG_LEVEL || 'info',
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
    new winston.transports.File({
      filename: path.join(process.cwd(), SERVER_CONFIG.LOG_DIR, 'app.log'),
      level: 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
    }),
    new winston.transports.File({
      filename: path.join(process.cwd(), SERVER_CONFIG.LOG_DIR, 'error.log'),
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
    }),
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
  } catch (error: unknown) {
    console.error('❌ Warning: Failed to create logs directory:', error instanceof Error ? error.message : error);
  }
})();

// Enhanced logger interface
export interface Logger {
  error: (message: string, meta?: any) => void;
  warn: (message: string, meta?: any) => void;
  info: (message: string, meta?: any) => void;
  http: (message: string, meta?: any) => void;
  debug: (message: string, meta?: any) => void;
  trace: (message: string, meta?: any) => void;
  command: (command: string, userId: string, success?: boolean, executionTime?: number | null, error?: any) => void;
  userActivity: (userId: string, action: string, details?: any) => void;
  groupActivity: (groupId: string, action: string, userId: string, details?: any) => void;
  apiRequest: (method: string, url: string, statusCode: number, responseTime: number, userId?: string | null) => void;
  performance: (operation: string, duration: number, metadata?: any) => void;
  security: (event: string, userId?: string | null, details?: any) => void;
  withContext: (context: any) => Logger;
  child: (meta?: any) => Logger;
  stream: { write: (message: string) => void };
}

// Enhanced logger implementation
const enhancedLogger: Logger = {
  error: (message, meta = {}) => { winstonLogger.error(message, meta); },
  warn: (message, meta = {}) => { winstonLogger.warn(message, meta); },
  info: (message, meta = {}) => { winstonLogger.info(message, meta); },
  http: (message, meta = {}) => { winstonLogger.http(message, meta); },
  debug: (message, meta = {}) => { winstonLogger.debug(message, meta); },
  trace: (message, meta = {}) => { winstonLogger.debug(message, meta); },

  command: (command, userId, success = true, executionTime = null, error = null) => {
    const level = success ? 'info' : 'error';
    const message = `Command: ${command} | User: ${userId} | Success: ${success}`;
    const meta = {
      command, userId, success, executionTime,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    };
    winstonLogger.log(level, message, meta);
  },

  userActivity: (userId, action, details = {}) => {
    winstonLogger.info(`User Activity: ${action} | User: ${userId}`, { userId, action, ...details });
  },

  groupActivity: (groupId, action, userId, details = {}) => {
    winstonLogger.info(`Group Activity: ${action} | Group: ${groupId} | User: ${userId}`, { groupId, userId, action, ...details });
  },

  apiRequest: (method, url, statusCode, responseTime, userId = null) => {
    const level = statusCode >= 400 ? 'warn' : 'http';
    winstonLogger.log(level, `${method} ${url} ${statusCode} ${responseTime}ms`, { method, url, statusCode, responseTime, userId });
  },

  performance: (operation, duration, metadata = {}) => {
    winstonLogger.info(`Performance: ${operation} took ${duration}ms`, { operation, duration, ...metadata });
  },

  security: (event, userId = null, details = {}) => {
    winstonLogger.warn(`Security Event: ${event}`, { userId, event, ...details });
  },

  withContext: (context) => ({
    ...enhancedLogger,
    error: (message, meta = {}) => enhancedLogger.error(message, { ...context, ...meta }),
    warn: (message, meta = {}) => enhancedLogger.warn(message, { ...context, ...meta }),
    info: (message, meta = {}) => enhancedLogger.info(message, { ...context, ...meta }),
    debug: (message, meta = {}) => enhancedLogger.debug(message, { ...context, ...meta }),
    trace: (message, meta = {}) => enhancedLogger.debug(message, { ...context, ...meta }),
  }),

  child: (meta = {}) => enhancedLogger.withContext(meta),

  stream: {
    write: (message) => { winstonLogger.http(message.trim()); },
  },
};

export { enhancedLogger as logger };
export default enhancedLogger;
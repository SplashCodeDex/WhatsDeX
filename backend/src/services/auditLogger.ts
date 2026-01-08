import path from 'path';
import winston from 'winston';
import { promises as fs } from 'fs';

class AuditLogger {
  constructor(databaseService, options = {}) {
    this.database = databaseService;
    this.options = {
      logToFile: options.logToFile !== false,
      logToDatabase: options.logToDatabase !== false,
      retentionDays: options.retentionDays || 90,
      maxFileSize: options.maxFileSize || '10m',
      maxFiles: options.maxFiles || 5,
      ...options,
    };

    this.logger = null;
    this.isInitialized = false;

    // Audit event types
    this.EVENT_TYPES = {
      // User actions
      USER_LOGIN: 'user_login',
      USER_LOGOUT: 'user_logout',
      USER_REGISTER: 'user_register',
      USER_UPDATE: 'user_update',
      USER_DELETE: 'user_delete',
      USER_BAN: 'user_ban',
      USER_UNBAN: 'user_unban',

      // Admin actions
      ADMIN_USER_MANAGE: 'admin_user_manage',
      ADMIN_SYSTEM_CONFIG: 'admin_system_config',
      ADMIN_CONTENT_MODERATE: 'admin_content_moderate',
      ADMIN_BACKUP: 'admin_backup',
      ADMIN_MAINTENANCE: 'admin_maintenance',

      // System events
      SYSTEM_START: 'system_start',
      SYSTEM_STOP: 'system_stop',
      SYSTEM_ERROR: 'system_error',
      SYSTEM_MAINTENANCE: 'system_maintenance',

      // Security events
      SECURITY_LOGIN_ATTEMPT: 'security_login_attempt',
      SECURITY_LOGIN_FAILURE: 'security_login_failure',
      SECURITY_PERMISSION_DENIED: 'security_permission_denied',
      SECURITY_SUSPICIOUS_ACTIVITY: 'security_suspicious_activity',

      // Content events
      CONTENT_CREATE: 'content_create',
      CONTENT_UPDATE: 'content_update',
      CONTENT_DELETE: 'content_delete',
      CONTENT_MODERATE: 'content_moderate',

      // Payment events
      PAYMENT_SUCCESS: 'payment_success',
      PAYMENT_FAILURE: 'payment_failure',
      PAYMENT_REFUND: 'payment_refund',
      SUBSCRIPTION_CHANGE: 'subscription_change',

      // API events
      API_REQUEST: 'api_request',
      API_ERROR: 'api_error',
      API_RATE_LIMIT: 'api_rate_limit',
    };

    // Risk levels
    this.RISK_LEVELS = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical',
    };
  }

  /**
   * Initialize the audit logger
   */
  async initialize() {
    try {
      // Create logs directory if it doesn't exist
      const logsDir = path.join(process.cwd(), 'logs', 'audit');
      await fs.mkdir(logsDir, { recursive: true });

      // Configure Winston logger
      const transports = [];

      if (this.options.logToFile) {
        transports.push(
          new winston.transports.File({
            filename: path.join(logsDir, 'audit.log'),
            level: 'info',
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.errors({ stack: true }),
              winston.format.json()
            ),
            maxsize: this.parseFileSize(this.options.maxFileSize),
            maxFiles: this.options.maxFiles,
          })
        );

        // Separate file for security events
        transports.push(
          new winston.transports.File({
            filename: path.join(logsDir, 'security.log'),
            level: 'warn',
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.errors({ stack: true }),
              winston.format.json()
            ),
            maxsize: this.parseFileSize(this.options.maxFileSize),
            maxFiles: this.options.maxFiles,
          })
        );
      }

      // Console transport for development
      if (process.env.NODE_ENV === 'development') {
        transports.push(
          new winston.transports.Console({
            level: 'debug',
            format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
          })
        );
      }

      this.logger = winston.createLogger({
        level: 'info',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json()
        ),
        transports,
      });

      this.isInitialized = true;

      // Log system initialization
      await this.logEvent({
        eventType: this.EVENT_TYPES.SYSTEM_START,
        actor: 'system',
        action: 'System initialization completed',
        resource: 'audit_logger',
        details: {
          version: process.env.npm_package_version || '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          timestamp: new Date().toISOString(),
        },
        riskLevel: this.RISK_LEVELS.LOW,
        ipAddress: 'system',
        userAgent: 'audit-logger',
      });
    } catch (error) {
      console.error('Failed to initialize audit logger:', error);
      throw error;
    }
  }

  /**
   * Parse file size string to bytes
   * @param {string} size - Size string (e.g., '10m', '1g')
   * @returns {number} Size in bytes
   */
  parseFileSize(size) {
    const units = {
      k: 1024,
      m: 1024 * 1024,
      g: 1024 * 1024 * 1024,
    };

    const match = size.toLowerCase().match(/^(\d+)([kmg]?)$/);
    if (!match) return 10 * 1024 * 1024; // Default 10MB

    const [, num, unit] = match;
    return parseInt(num) * (units[unit] || 1);
  }

  /**
   * Log an audit event
   * @param {Object} eventData - Event data
   */
  async logEvent(eventData) {
    if (!this.isInitialized) {
      console.warn('Audit logger not initialized');
      return;
    }

    try {
      const auditEntry = {
        id: this.generateId(),
        timestamp: new Date().toISOString(),
        eventType: eventData.eventType,
        actor: eventData.actor || 'system',
        actorId: eventData.actorId,
        action: eventData.action,
        resource: eventData.resource,
        resourceId: eventData.resourceId,
        details: eventData.details || {},
        riskLevel: eventData.riskLevel || this.RISK_LEVELS.LOW,
        ipAddress: eventData.ipAddress,
        userAgent: eventData.userAgent,
        sessionId: eventData.sessionId,
        location: eventData.location,
        metadata: eventData.metadata || {},
      };

      // Log to Winston
      const logLevel = this.getLogLevel(auditEntry.riskLevel);
      this.logger.log(logLevel, 'Audit Event', auditEntry);

      // Log to database if enabled
      if (this.options.logToDatabase && this.database) {
        await this.database.prisma.auditLog.create({
          data: {
            eventType: auditEntry.eventType,
            actor: auditEntry.actor,
            actorId: auditEntry.actorId,
            action: auditEntry.action,
            resource: auditEntry.resource,
            resourceId: auditEntry.resourceId,
            details: JSON.stringify(auditEntry.details),
            riskLevel: auditEntry.riskLevel,
            ipAddress: auditEntry.ipAddress,
            userAgent: auditEntry.userAgent,
            sessionId: auditEntry.sessionId,
            location: auditEntry.location,
            metadata: JSON.stringify(auditEntry.metadata),
          },
        });
      }

      // Emit real-time event if WebSocket service is available
      if (this.websocketService) {
        this.websocketService.broadcast({
          type: 'audit_event',
          data: {
            id: auditEntry.id,
            eventType: auditEntry.eventType,
            actor: auditEntry.actor,
            action: auditEntry.action,
            timestamp: auditEntry.timestamp,
            riskLevel: auditEntry.riskLevel,
          },
        });
      }
    } catch (error) {
      console.error('Failed to log audit event:', error);
      // Fallback to console logging
      console.log('AUDIT EVENT:', JSON.stringify(eventData, null, 2));
    }
  }

  /**
   * Generate unique ID for audit entries
   * @returns {string} Unique ID
   */
  generateId() {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get Winston log level based on risk level
   * @param {string} riskLevel - Risk level
   * @returns {string} Winston log level
   */
  getLogLevel(riskLevel) {
    switch (riskLevel) {
      case this.RISK_LEVELS.CRITICAL:
        return 'error';
      case this.RISK_LEVELS.HIGH:
        return 'warn';
      case this.RISK_LEVELS.MEDIUM:
        return 'info';
      case this.RISK_LEVELS.LOW:
      default:
        return 'info';
    }
  }

  /**
   * Log user authentication events
   * @param {Object} data - Authentication data
   */
  async logUserAuth(data) {
    const eventType = data.success
      ? this.EVENT_TYPES.USER_LOGIN
      : this.EVENT_TYPES.SECURITY_LOGIN_FAILURE;

    await this.logEvent({
      eventType,
      actor: data.username || data.email || 'unknown',
      actorId: data.userId,
      action: data.success ? 'User login successful' : 'User login failed',
      resource: 'authentication',
      details: {
        method: data.method || 'password',
        success: data.success,
        failureReason: data.failureReason,
        deviceInfo: data.deviceInfo,
      },
      riskLevel: data.success ? this.RISK_LEVELS.LOW : this.RISK_LEVELS.MEDIUM,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      sessionId: data.sessionId,
      location: data.location,
    });
  }

  /**
   * Log user management events
   * @param {Object} data - User management data
   */
  async logUserManagement(data) {
    let eventType;
    let action;
    let riskLevel;

    switch (data.action) {
      case 'create':
        eventType = this.EVENT_TYPES.USER_REGISTER;
        action = 'User account created';
        riskLevel = this.RISK_LEVELS.LOW;
        break;
      case 'update':
        eventType = this.EVENT_TYPES.USER_UPDATE;
        action = 'User account updated';
        riskLevel = this.RISK_LEVELS.LOW;
        break;
      case 'delete':
        eventType = this.EVENT_TYPES.USER_DELETE;
        action = 'User account deleted';
        riskLevel = this.RISK_LEVELS.HIGH;
        break;
      case 'ban':
        eventType = this.EVENT_TYPES.USER_BAN;
        action = 'User account banned';
        riskLevel = this.RISK_LEVELS.MEDIUM;
        break;
      case 'unban':
        eventType = this.EVENT_TYPES.USER_UNBAN;
        action = 'User account unbanned';
        riskLevel = this.RISK_LEVELS.LOW;
        break;
      default:
        eventType = this.EVENT_TYPES.ADMIN_USER_MANAGE;
        action = `User ${data.action}`;
        riskLevel = this.RISK_LEVELS.MEDIUM;
    }

    await this.logEvent({
      eventType,
      actor: data.adminUser || 'system',
      actorId: data.adminUserId,
      action,
      resource: 'user',
      resourceId: data.targetUserId,
      details: {
        targetUser: data.targetUser,
        changes: data.changes,
        reason: data.reason,
        duration: data.duration,
      },
      riskLevel,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      sessionId: data.sessionId,
    });
  }

  /**
   * Log payment events
   * @param {Object} data - Payment data
   */
  async logPayment(data) {
    let eventType;
    let action;
    let riskLevel;

    switch (data.type) {
      case 'success':
        eventType = this.EVENT_TYPES.PAYMENT_SUCCESS;
        action = 'Payment processed successfully';
        riskLevel = this.RISK_LEVELS.LOW;
        break;
      case 'failure':
        eventType = this.EVENT_TYPES.PAYMENT_FAILURE;
        action = 'Payment processing failed';
        riskLevel = this.RISK_LEVELS.MEDIUM;
        break;
      case 'refund':
        eventType = this.EVENT_TYPES.PAYMENT_REFUND;
        action = 'Payment refunded';
        riskLevel = this.RISK_LEVELS.MEDIUM;
        break;
      default:
        eventType = this.EVENT_TYPES.SUBSCRIPTION_CHANGE;
        action = `Subscription ${data.type}`;
        riskLevel = this.RISK_LEVELS.LOW;
    }

    await this.logEvent({
      eventType,
      actor: data.userId,
      action,
      resource: 'payment',
      resourceId: data.paymentId,
      details: {
        amount: data.amount,
        currency: data.currency,
        method: data.method,
        subscriptionId: data.subscriptionId,
        plan: data.plan,
        failureReason: data.failureReason,
      },
      riskLevel,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      sessionId: data.sessionId,
    });
  }

  /**
   * Log security events
   * @param {Object} data - Security event data
   */
  async logSecurity(data) {
    let eventType;
    let action;
    let riskLevel;

    switch (data.type) {
      case 'permission_denied':
        eventType = this.EVENT_TYPES.SECURITY_PERMISSION_DENIED;
        action = 'Permission denied';
        riskLevel = this.RISK_LEVELS.MEDIUM;
        break;
      case 'suspicious_activity':
        eventType = this.EVENT_TYPES.SECURITY_SUSPICIOUS_ACTIVITY;
        action = 'Suspicious activity detected';
        riskLevel = this.RISK_LEVELS.HIGH;
        break;
      case 'rate_limit':
        eventType = this.EVENT_TYPES.API_RATE_LIMIT;
        action = 'Rate limit exceeded';
        riskLevel = this.RISK_LEVELS.MEDIUM;
        break;
      default:
        eventType = this.EVENT_TYPES.SECURITY_LOGIN_ATTEMPT;
        action = `Security event: ${data.type}`;
        riskLevel = this.RISK_LEVELS.MEDIUM;
    }

    await this.logEvent({
      eventType,
      actor: data.userId || 'unknown',
      action,
      resource: data.resource || 'system',
      details: {
        type: data.type,
        reason: data.reason,
        attempts: data.attempts,
        threshold: data.threshold,
        blocked: data.blocked,
      },
      riskLevel,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      sessionId: data.sessionId,
      location: data.location,
      metadata: data.metadata || {},
    });
  }

  /**
   * Log API events
   * @param {Object} data - API event data
   */
  async logAPI(data) {
    const eventType = data.error ? this.EVENT_TYPES.API_ERROR : this.EVENT_TYPES.API_REQUEST;

    await this.logEvent({
      eventType,
      actor: data.userId || 'anonymous',
      action: data.error ? 'API request failed' : 'API request processed',
      resource: 'api',
      resourceId: data.endpoint,
      details: {
        method: data.method,
        endpoint: data.endpoint,
        statusCode: data.statusCode,
        responseTime: data.responseTime,
        error: data.error,
        userAgent: data.userAgent,
        query: data.query,
        body: data.body,
      },
      riskLevel: data.error ? this.RISK_LEVELS.MEDIUM : this.RISK_LEVELS.LOW,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      sessionId: data.sessionId,
    });
  }

  /**
   * Log system events
   * @param {Object} data - System event data
   */
  async logSystem(data) {
    let eventType;
    let action;
    let riskLevel;

    switch (data.type) {
      case 'start':
        eventType = this.EVENT_TYPES.SYSTEM_START;
        action = 'System started';
        riskLevel = this.RISK_LEVELS.LOW;
        break;
      case 'stop':
        eventType = this.EVENT_TYPES.SYSTEM_STOP;
        action = 'System stopped';
        riskLevel = this.RISK_LEVELS.LOW;
        break;
      case 'error':
        eventType = this.EVENT_TYPES.SYSTEM_ERROR;
        action = 'System error occurred';
        riskLevel = this.RISK_LEVELS.HIGH;
        break;
      case 'maintenance':
        eventType = this.EVENT_TYPES.SYSTEM_MAINTENANCE;
        action = 'System maintenance performed';
        riskLevel = this.RISK_LEVELS.LOW;
        break;
      default:
        eventType = this.EVENT_TYPES.SYSTEM_MAINTENANCE;
        action = `System event: ${data.type}`;
        riskLevel = this.RISK_LEVELS.LOW;
    }

    await this.logEvent({
      eventType,
      actor: 'system',
      action,
      resource: 'system',
      details: {
        type: data.type,
        uptime: data.uptime,
        memoryUsage: data.memoryUsage,
        error: data.error,
        maintenanceType: data.maintenanceType,
      },
      riskLevel,
      riskLevel,
      metadata: data.metadata || {},
    });
  }

  /**
   * Query audit logs with filters
   * @param {Object} filters - Query filters
   * @returns {Promise<Array>} Audit log entries
   */
  async queryLogs(filters = {}) {
    if (!this.database) {
      throw new Error('Database service not available for querying logs');
    }

    const where = {};

    if (filters.eventType) where.eventType = filters.eventType;
    if (filters.actor) where.actor = { contains: filters.actor };
    if (filters.actorId) where.actorId = filters.actorId;
    if (filters.resource) where.resource = filters.resource;
    if (filters.resourceId) where.resourceId = filters.resourceId;
    if (filters.riskLevel) where.riskLevel = filters.riskLevel;
    if (filters.ipAddress) where.ipAddress = filters.ipAddress;

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const logs = await this.database.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 100,
      skip: filters.offset || 0,
    });

    return logs.map(log => ({
      ...log,
      details: JSON.parse(log.details || '{}'),
      metadata: JSON.parse(log.metadata || '{}'),
    }));
  }

  /**
   * Get audit statistics
   * @param {Object} filters - Statistics filters
   * @returns {Promise<Object>} Audit statistics
   */
  async getStatistics(filters = {}) {
    if (!this.database) {
      throw new Error('Database service not available for statistics');
    }

    const where = {};
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const [totalEvents, eventsByType, eventsByRisk, recentEvents] = await Promise.all([
      this.database.prisma.auditLog.count({ where }),
      this.database.prisma.auditLog.groupBy({
        by: ['eventType'],
        where,
        _count: { id: true },
      }),
      this.database.prisma.auditLog.groupBy({
        by: ['riskLevel'],
        where,
        _count: { id: true },
      }),
      this.database.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    return {
      totalEvents,
      eventsByType: eventsByType.reduce((acc, item) => {
        acc[item.eventType] = item._count.id;
        return acc;
      }, {}),
      eventsByRisk: eventsByRisk.reduce((acc, item) => {
        acc[item.riskLevel] = item._count.id;
        return acc;
      }, {}),
      recentEvents: recentEvents.map(event => ({
        ...event,
        details: JSON.parse(event.details || '{}'),
      })),
    };
  }

  /**
   * Clean up old audit logs
   * @returns {Promise<number>} Number of deleted entries
   */
  async cleanup() {
    if (!this.database) return 0;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.options.retentionDays);

    const result = await this.database.prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    await this.logEvent({
      eventType: this.EVENT_TYPES.SYSTEM_MAINTENANCE,
      actor: 'system',
      action: 'Audit log cleanup completed',
      resource: 'audit_logs',
      details: {
        deletedCount: result.count,
        retentionDays: this.options.retentionDays,
        cutoffDate: cutoffDate.toISOString(),
      },
      riskLevel: this.RISK_LEVELS.LOW,
    });

    return result.count;
  }

  /**
   * Export audit logs to file
   * @param {Object} filters - Export filters
   * @param {string} format - Export format (json, csv)
   * @returns {Promise<string>} File path
   */
  async exportLogs(filters = {}, format = 'json') {
    const logs = await this.queryLogs({ ...filters, limit: 10000 });

    const exportDir = path.join(process.cwd(), 'exports');
    await fs.mkdir(exportDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `audit_logs_${timestamp}.${format}`;
    const filepath = path.join(exportDir, filename);

    if (format === 'csv') {
      const csvHeaders = [
        'ID',
        'Timestamp',
        'Event Type',
        'Actor',
        'Actor ID',
        'Action',
        'Resource',
        'Resource ID',
        'Risk Level',
        'IP Address',
        'Details',
      ];

      const csvRows = logs.map(log => [
        log.id,
        log.createdAt,
        log.eventType,
        log.actor,
        log.actorId || '',
        log.action,
        log.resource,
        log.resourceId || '',
        log.riskLevel,
        log.ipAddress || '',
        JSON.stringify(log.details).replace(/"/g, '""'),
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      await fs.writeFile(filepath, csvContent, 'utf8');
    } else {
      await fs.writeFile(filepath, JSON.stringify(logs, null, 2), 'utf8');
    }

    await this.logEvent({
      eventType: this.EVENT_TYPES.ADMIN_BACKUP,
      actor: 'system',
      action: 'Audit logs exported',
      resource: 'audit_logs',
      details: {
        format,
        recordCount: logs.length,
        filters,
        filepath,
      },
      riskLevel: this.RISK_LEVELS.LOW,
    });

    return filepath;
  }

  /**
   * Set WebSocket service for real-time events
   * @param {Object} websocketService - WebSocket service instance
   */
  setWebSocketService(websocketService) {
    this.websocketService = websocketService;
  }

  /**
   * Check if audit logger is ready
   * @returns {boolean} Ready status
   */
  isReady() {
    return this.isInitialized;
  }

  /**
   * Close audit logger and cleanup resources
   */
  async close() {
    if (this.logger) {
      await this.logEvent({
        eventType: this.EVENT_TYPES.SYSTEM_STOP,
        actor: 'system',
        action: 'Audit logger shutting down',
        resource: 'audit_logger',
        details: {
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
        },
        riskLevel: this.RISK_LEVELS.LOW,
      });

      this.logger.end();
    }

    this.isInitialized = false;
  }
}

export default AuditLogger;

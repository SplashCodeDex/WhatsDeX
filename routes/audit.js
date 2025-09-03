const express = require('express');
const { query, param, validationResult } = require('express-validator');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { requireModerator } = require('../middleware/auth');
const logger = require('../src/utils/logger');

const router = express.Router();

// Import services (will be created)
const auditService = require('../src/services/auditService');

/**
 * GET /api/audit
 * Get audit logs with filtering and pagination
 */
router.get('/',
  requireModerator,
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('eventType').optional().isString(),
    query('actor').optional().isString(),
    query('actorId').optional().isString(),
    query('resource').optional().isString(),
    query('resourceId').optional().isString(),
    query('riskLevel').optional().isIn(['low', 'medium', 'high', 'critical']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('sortBy').optional().isIn(['createdAt', 'eventType', 'actor', 'riskLevel']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const {
      page = 1,
      limit = 50,
      eventType,
      actor,
      actorId,
      resource,
      resourceId,
      riskLevel,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filters = {
      eventType,
      actor,
      actorId,
      resource,
      resourceId,
      riskLevel,
      startDate,
      endDate,
      sortBy,
      sortOrder
    };

    const result = await auditService.getAuditLogs(filters, { page, limit });

    res.json({
      success: true,
      data: result.logs,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit)
      },
      filters
    });
  })
);

/**
 * GET /api/audit/:id
 * Get specific audit log entry
 */
router.get('/:id',
  requireModerator,
  [
    param('id').isString().notEmpty()
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Invalid audit log ID', 400, 'VALIDATION_ERROR');
    }

    const { id } = req.params;
    const auditLog = await auditService.getAuditLogById(id);

    if (!auditLog) {
      throw new AppError('Audit log not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: auditLog
    });
  })
);

/**
 * GET /api/audit/statistics
 * Get audit statistics and analytics
 */
router.get('/statistics',
  requireModerator,
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { startDate, endDate } = req.query;
    const stats = await auditService.getStatistics({ startDate, endDate });

    res.json({
      success: true,
      data: stats
    });
  })
);

/**
 * GET /api/audit/export
 * Export audit logs
 */
router.get('/export',
  requireModerator,
  [
    query('format').optional().isIn(['csv', 'json']),
    query('eventType').optional().isString(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('riskLevel').optional().isIn(['low', 'medium', 'high', 'critical'])
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const {
      format = 'csv',
      eventType,
      startDate,
      endDate,
      riskLevel
    } = req.query;

    const filters = {
      eventType,
      startDate,
      endDate,
      riskLevel
    };

    const exportData = await auditService.exportAuditLogs(filters, format);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `audit_logs_${timestamp}.${format}`;

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    }

    res.send(exportData);
  })
);

/**
 * GET /api/audit/event-types
 * Get available audit event types
 */
router.get('/event-types',
  requireModerator,
  asyncHandler(async (req, res) => {
    const eventTypes = await auditService.getEventTypes();

    res.json({
      success: true,
      data: eventTypes
    });
  })
);

/**
 * GET /api/audit/risk-levels
 * Get audit risk levels
 */
router.get('/risk-levels',
  requireModerator,
  asyncHandler(async (req, res) => {
    const riskLevels = [
      { value: 'low', label: 'Low', color: 'green' },
      { value: 'medium', label: 'Medium', color: 'yellow' },
      { value: 'high', label: 'High', color: 'orange' },
      { value: 'critical', label: 'Critical', color: 'red' }
    ];

    res.json({
      success: true,
      data: riskLevels
    });
  })
);

/**
 * GET /api/audit/search
 * Advanced search in audit logs
 */
router.get('/search',
  requireModerator,
  [
    query('query').isString().notEmpty(),
    query('fields').optional().isArray(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const {
      query,
      fields = ['actor', 'action', 'resource', 'details'],
      page = 1,
      limit = 50
    } = req.query;

    const result = await auditService.searchAuditLogs(query, fields, { page, limit });

    res.json({
      success: true,
      data: result.logs,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit)
      },
      search: {
        query,
        fields
      }
    });
  })
);

/**
 * GET /api/audit/user-activity/:userId
 * Get audit logs for specific user
 */
router.get('/user-activity/:userId',
  requireModerator,
  [
    param('userId').isString().notEmpty(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { userId } = req.params;
    const {
      page = 1,
      limit = 50,
      startDate,
      endDate
    } = req.query;

    const result = await auditService.getUserActivity(userId, { startDate, endDate }, { page, limit });

    res.json({
      success: true,
      data: result.logs,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit)
      },
      user: {
        id: userId,
        activityPeriod: { startDate, endDate }
      }
    });
  })
);

/**
 * GET /api/audit/resource-activity/:resource/:resourceId
 * Get audit logs for specific resource
 */
router.get('/resource-activity/:resource/:resourceId',
  requireModerator,
  [
    param('resource').isString().notEmpty(),
    param('resourceId').isString().notEmpty(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { resource, resourceId } = req.params;
    const {
      page = 1,
      limit = 50,
      startDate,
      endDate
    } = req.query;

    const result = await auditService.getResourceActivity(resource, resourceId, { startDate, endDate }, { page, limit });

    res.json({
      success: true,
      data: result.logs,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit)
      },
      resource: {
        type: resource,
        id: resourceId,
        activityPeriod: { startDate, endDate }
      }
    });
  })
);

/**
 * DELETE /api/audit/cleanup
 * Clean up old audit logs (admin only)
 */
router.delete('/cleanup',
  requireAdmin,
  [
    query('days').optional().isInt({ min: 1, max: 365 }).toInt()
  ],
  asyncHandler(async (req, res) => {
    const { days = 90 } = req.query;

    const result = await auditService.cleanupOldLogs(days);

    // Log the cleanup action
    await auditService.logEvent({
      eventType: 'SYSTEM_MAINTENANCE',
      actor: req.user.id,
      actorId: req.user.id,
      action: 'Cleaned up old audit logs',
      resource: 'audit_logs',
      details: {
        deletedCount: result.deletedCount,
        retentionDays: days,
        cleanupTime: new Date().toISOString()
      },
      riskLevel: 'MEDIUM',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      data: result,
      message: `Cleaned up ${result.deletedCount} old audit log entries`
    });
  })
);

module.exports = router;
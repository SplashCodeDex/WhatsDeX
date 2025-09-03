const express = require('express');
const { query, param, validationResult } = require('express-validator');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { requireModerator, requireAdmin } = require('../middleware/auth');
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

module.exports = router;
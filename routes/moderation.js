const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { requireModerator, requireAdmin } = require('../middleware/auth');
const logger = require('../src/utils/logger');

const router = express.Router();

// Import services (will be created)
const moderationService = require('../src/services/moderationService');
const auditLogger = require('../src/services/auditLogger');

/**
 * GET /api/moderation/queue
 * Get moderation queue with filtering
 */
router.get(
  '/queue',
  requireModerator,
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('status').optional().isIn(['pending', 'approved', 'rejected', 'escalated']),
    query('priority').optional().isIn(['low', 'normal', 'high', 'urgent']),
    query('contentType').optional().isIn(['message', 'image', 'file', 'profile']),
    query('sortBy').optional().isIn(['createdAt', 'priority', 'contentType']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const {
      page = 1,
      limit = 50,
      status = 'pending',
      priority,
      contentType,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const filters = {
      status,
      priority,
      contentType,
      sortBy,
      sortOrder,
    };

    const result = await moderationService.getModerationQueue(filters, { page, limit });

    res.json({
      success: true,
      data: result.items,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
      filters,
    });
  })
);

/**
 * GET /api/moderation/queue/:id
 * Get specific moderation queue item
 */
router.get(
  '/queue/:id',
  requireModerator,
  [param('id').isString().notEmpty()],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Invalid moderation queue ID', 400, 'VALIDATION_ERROR');
    }

    const { id } = req.params;
    const item = await moderationService.getModerationQueueItem(id);

    if (!item) {
      throw new AppError('Moderation queue item not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: item,
    });
  })
);

/**
 * POST /api/moderation/queue/:id/review
 * Review a moderation queue item
 */
router.post(
  '/queue/:id/review',
  requireModerator,
  [
    param('id').isString().notEmpty(),
    body('action').isIn(['approve', 'reject', 'escalate']),
    body('reason').optional().isString().trim(),
    body('notes').optional().isString().trim(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { id } = req.params;
    const { action, reason, notes } = req.body;

    const result = await moderationService.reviewModerationItem(id, {
      action,
      reason,
      notes,
      moderatorId: req.user.id,
    });

    // Log admin action
    await auditLogger.logEvent({
      eventType: auditLogger.EVENT_TYPES.ADMIN_USER_MANAGE,
      actor: req.user.id,
      actorId: req.user.id,
      action: `Moderation review: ${action}`,
      resource: 'moderation_queue',
      resourceId: id,
      details: {
        action,
        reason,
        notes,
        contentType: result.contentType,
        userId: result.userId,
      },
      riskLevel:
        action === 'escalate' ? auditLogger.RISK_LEVELS.HIGH : auditLogger.RISK_LEVELS.MEDIUM,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      data: result,
      message: `Item ${action}d successfully`,
    });
  })
);

/**
 * POST /api/moderation/bulk-review
 * Bulk review moderation queue items
 */
router.post(
  '/bulk-review',
  requireModerator,
  [
    body('itemIds').isArray({ min: 1 }),
    body('itemIds.*').isString().notEmpty(),
    body('action').isIn(['approve', 'reject', 'escalate']),
    body('reason').optional().isString().trim(),
    body('notes').optional().isString().trim(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { itemIds, action, reason, notes } = req.body;

    const result = await moderationService.bulkReviewModerationItems(itemIds, {
      action,
      reason,
      notes,
      moderatorId: req.user.id,
    });

    // Log admin action
    await auditLogger.logEvent({
      eventType: auditLogger.EVENT_TYPES.ADMIN_USER_MANAGE,
      actor: req.user.id,
      actorId: req.user.id,
      action: `Bulk moderation review: ${action}`,
      resource: 'moderation_queue',
      details: {
        action,
        itemCount: itemIds.length,
        successfulCount: result.successful.length,
        failedCount: result.failed.length,
        reason,
        notes,
      },
      riskLevel: auditLogger.RISK_LEVELS.HIGH,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      data: result,
      message: `Bulk review completed: ${result.successful.length} successful, ${result.failed.length} failed`,
    });
  })
);

/**
 * GET /api/moderation/statistics
 * Get moderation statistics
 */
router.get(
  '/statistics',
  requireModerator,
  [query('startDate').optional().isISO8601(), query('endDate').optional().isISO8601()],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { startDate, endDate } = req.query;
    const stats = await moderationService.getModerationStatistics({ startDate, endDate });

    res.json({
      success: true,
      data: stats,
    });
  })
);

/**
 * GET /api/moderation/user-violations/:userId
 * Get violation history for a specific user
 */
router.get(
  '/user-violations/:userId',
  requireModerator,
  [
    param('userId').isString().notEmpty(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('status').optional().isIn(['active', 'expired', 'appealed']),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { userId } = req.params;
    const { page = 1, limit = 50, status } = req.query;

    const result = await moderationService.getUserViolations(userId, { status }, { page, limit });

    res.json({
      success: true,
      data: result.violations,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
      user: {
        id: userId,
        totalViolations: result.total,
      },
    });
  })
);

/**
 * POST /api/moderation/user-violations/:userId
 * Add a violation for a user
 */
router.post(
  '/user-violations/:userId',
  requireModerator,
  [
    param('userId').isString().notEmpty(),
    body('violationType').isIn([
      'hate_speech',
      'violence',
      'spam',
      'harassment',
      'bullying',
      'discrimination',
      'self_harm',
      'illegal_activities',
    ]),
    body('severity').isIn(['low', 'medium', 'high', 'critical']),
    body('reason').isString().trim().isLength({ min: 1, max: 500 }),
    body('evidence').optional().isString(),
    body('action').isIn(['warn', 'ban', 'delete', 'none']),
    body('duration').optional().isInt({ min: 1 }), // duration in hours
    body('notes').optional().isString().trim(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { userId } = req.params;
    const violationData = {
      ...req.body,
      moderatorId: req.user.id,
    };

    const violation = await moderationService.addUserViolation(userId, violationData);

    // Log admin action
    await auditLogger.logEvent({
      eventType: auditLogger.EVENT_TYPES.ADMIN_USER_MANAGE,
      actor: req.user.id,
      actorId: req.user.id,
      action: 'Added user violation',
      resource: 'user_violation',
      resourceId: violation.id,
      details: {
        userId,
        violationType: violationData.violationType,
        severity: violationData.severity,
        action: violationData.action,
        duration: violationData.duration,
        reason: violationData.reason,
      },
      riskLevel: auditLogger.RISK_LEVELS.HIGH,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.status(201).json({
      success: true,
      data: violation,
      message: 'Violation added successfully',
    });
  })
);

/**
 * PUT /api/moderation/user-violations/:violationId
 * Update a user violation
 */
router.put(
  '/user-violations/:violationId',
  requireModerator,
  [
    param('violationId').isString().notEmpty(),
    body('status').optional().isIn(['active', 'expired', 'appealed']),
    body('notes').optional().isString().trim(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { violationId } = req.params;
    const updateData = req.body;

    const updatedViolation = await moderationService.updateUserViolation(violationId, updateData);

    if (!updatedViolation) {
      throw new AppError('Violation not found', 404, 'NOT_FOUND');
    }

    // Log admin action
    await auditLogger.logEvent({
      eventType: auditLogger.EVENT_TYPES.ADMIN_USER_MANAGE,
      actor: req.user.id,
      actorId: req.user.id,
      action: 'Updated user violation',
      resource: 'user_violation',
      resourceId: violationId,
      details: {
        changes: updateData,
        violationType: updatedViolation.violationType,
        userId: updatedViolation.userId,
      },
      riskLevel: auditLogger.RISK_LEVELS.MEDIUM,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      data: updatedViolation,
      message: 'Violation updated successfully',
    });
  })
);

/**
 * GET /api/moderation/settings
 * Get moderation settings
 */
router.get(
  '/settings',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const settings = await moderationService.getModerationSettings();

    res.json({
      success: true,
      data: settings,
    });
  })
);

/**
 * PUT /api/moderation/settings
 * Update moderation settings
 */
router.put(
  '/settings',
  requireAdmin,
  [
    body('contentModerationEnabled').optional().isBoolean(),
    body('autoModeration').optional().isBoolean(),
    body('moderationThreshold').optional().isFloat({ min: 0, max: 1 }),
    body('bannedWords').optional().isArray(),
    body('maxMessageLength').optional().isInt({ min: 1 }),
    body('rateLimitEnabled').optional().isBoolean(),
    body('spamDetectionEnabled').optional().isBoolean(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const settings = req.body;
    const updatedSettings = await moderationService.updateModerationSettings(settings);

    // Log admin action
    await auditLogger.logEvent({
      eventType: auditLogger.EVENT_TYPES.ADMIN_SYSTEM_CONFIG,
      actor: req.user.id,
      actorId: req.user.id,
      action: 'Updated moderation settings',
      resource: 'moderation_settings',
      details: {
        settings: Object.keys(settings),
        updatedAt: new Date().toISOString(),
      },
      riskLevel: auditLogger.RISK_LEVELS.MEDIUM,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      data: updatedSettings,
      message: 'Moderation settings updated successfully',
    });
  })
);

module.exports = router;

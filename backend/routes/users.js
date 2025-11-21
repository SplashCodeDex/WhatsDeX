const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { requireAdmin, requireModerator } = require('../middleware/auth');
const logger = require('../src/utils/logger');

const router = express.Router();

// Import services (will be created)
const userService = require('../src/services/userService');
const auditLogger = require('../src/services/auditLogger');

/**
 * GET /api/users
 * Get users with pagination, filtering, and search
 */
router.get(
  '/',
  requireModerator,
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('search').optional().isString().trim(),
    query('status').optional().isIn(['active', 'inactive', 'banned']),
    query('plan').optional().isIn(['free', 'basic', 'pro', 'enterprise']),
    query('sortBy').optional().isIn(['name', 'email', 'createdAt', 'lastActivity', 'level']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
  ],
  asyncHandler(async (req, res) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const {
      page = 1,
      limit = 20,
      search,
      status,
      plan,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const filters = {
      search,
      status,
      plan,
      sortBy,
      sortOrder,
    };

    const result = await userService.getUsers(filters, { page, limit });

    // Log admin action
    await auditLogger.logEvent({
      eventType: auditLogger.EVENT_TYPES.ADMIN_USER_MANAGE,
      actor: req.user.id,
      actorId: req.user.id,
      action: 'Viewed user list',
      resource: 'users',
      details: {
        filters,
        page,
        limit,
        resultCount: result.users.length,
      },
      riskLevel: auditLogger.RISK_LEVELS.LOW,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      data: result.users,
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
 * GET /api/users/:id
 * Get user details by ID
 */
router.get(
  '/:id',
  requireModerator,
  [param('id').isString().notEmpty()],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Invalid user ID', 400, 'VALIDATION_ERROR');
    }

    const { id } = req.params;
    const user = await userService.getUserById(id);

    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    // Log admin action
    await auditLogger.logEvent({
      eventType: auditLogger.EVENT_TYPES.ADMIN_USER_MANAGE,
      actor: req.user.id,
      actorId: req.user.id,
      action: 'Viewed user details',
      resource: 'user',
      resourceId: id,
      details: {
        userId: id,
        userName: user.name,
        userEmail: user.email,
      },
      riskLevel: auditLogger.RISK_LEVELS.LOW,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      data: user,
    });
  })
);

/**
 * POST /api/users
 * Create new user
 */
router.post(
  '/',
  requireAdmin,
  [
    body('name').optional().isString().trim().isLength({ min: 1, max: 100 }),
    body('email').isEmail().normalizeEmail(),
    body('phone').optional().isString().trim(),
    body('plan').optional().isIn(['free', 'basic', 'pro', 'enterprise']),
    body('premium').optional().isBoolean(),
    body('premiumExpiry').optional().isISO8601(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const userData = req.body;
    const newUser = await userService.createUser(userData);

    // Log admin action
    await auditLogger.logEvent({
      eventType: auditLogger.EVENT_TYPES.USER_REGISTER,
      actor: req.user.id,
      actorId: req.user.id,
      action: 'Created new user',
      resource: 'user',
      resourceId: newUser.id,
      details: {
        userData: {
          name: userData.name,
          email: userData.email,
          plan: userData.plan,
        },
      },
      riskLevel: auditLogger.RISK_LEVELS.MEDIUM,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.status(201).json({
      success: true,
      data: newUser,
      message: 'User created successfully',
    });
  })
);

/**
 * PUT /api/users/:id
 * Update user
 */
router.put(
  '/:id',
  requireModerator,
  [
    param('id').isString().notEmpty(),
    body('name').optional().isString().trim().isLength({ min: 1, max: 100 }),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().isString().trim(),
    body('plan').optional().isIn(['free', 'basic', 'pro', 'enterprise']),
    body('premium').optional().isBoolean(),
    body('premiumExpiry').optional().isISO8601(),
    body('banned').optional().isBoolean(),
    body('banReason').optional().isString().trim(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { id } = req.params;
    const updateData = req.body;

    const updatedUser = await userService.updateUser(id, updateData);

    if (!updatedUser) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    // Log admin action
    await auditLogger.logEvent({
      eventType: auditLogger.EVENT_TYPES.USER_UPDATE,
      actor: req.user.id,
      actorId: req.user.id,
      action: 'Updated user',
      resource: 'user',
      resourceId: id,
      details: {
        changes: updateData,
        userName: updatedUser.name,
        userEmail: updatedUser.email,
      },
      riskLevel: auditLogger.RISK_LEVELS.MEDIUM,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully',
    });
  })
);

/**
 * DELETE /api/users/:id
 * Delete user
 */
router.delete(
  '/:id',
  requireAdmin,
  [param('id').isString().notEmpty()],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Invalid user ID', 400, 'VALIDATION_ERROR');
    }

    const { id } = req.params;
    const deletedUser = await userService.deleteUser(id);

    if (!deletedUser) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    // Log admin action
    await auditLogger.logEvent({
      eventType: auditLogger.EVENT_TYPES.USER_DELETE,
      actor: req.user.id,
      actorId: req.user.id,
      action: 'Deleted user',
      resource: 'user',
      resourceId: id,
      details: {
        userName: deletedUser.name,
        userEmail: deletedUser.email,
        deletionTime: new Date().toISOString(),
      },
      riskLevel: auditLogger.RISK_LEVELS.HIGH,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  })
);

/**
 * POST /api/users/bulk-action
 * Bulk operations on users
 */
router.post(
  '/bulk-action',
  requireAdmin,
  [
    body('action').isIn(['ban', 'unban', 'delete', 'update_plan']),
    body('userIds').isArray({ min: 1 }),
    body('userIds.*').isString().notEmpty(),
    body('plan').optional().isIn(['free', 'basic', 'pro', 'enterprise']),
    body('reason').optional().isString().trim(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { action, userIds, plan, reason } = req.body;

    const result = await userService.bulkAction(action, userIds, { plan, reason });

    // Log admin action
    await auditLogger.logEvent({
      eventType: auditLogger.EVENT_TYPES.ADMIN_USER_MANAGE,
      actor: req.user.id,
      actorId: req.user.id,
      action: `Bulk ${action} users`,
      resource: 'users',
      details: {
        action,
        userCount: userIds.length,
        plan,
        reason,
        affectedUsers: userIds,
      },
      riskLevel: auditLogger.RISK_LEVELS.HIGH,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      data: result,
      message: `Successfully ${action}ed ${result.successful.length} users`,
    });
  })
);

/**
 * GET /api/users/export
 * Export users to CSV/JSON
 */
router.get(
  '/export',
  requireModerator,
  [
    query('format').optional().isIn(['csv', 'json']),
    query('status').optional().isIn(['active', 'inactive', 'banned']),
    query('plan').optional().isIn(['free', 'basic', 'pro', 'enterprise']),
  ],
  asyncHandler(async (req, res) => {
    const { format = 'csv', status, plan } = req.query;

    const filters = { status, plan };
    const exportData = await userService.exportUsers(filters, format);

    // Set appropriate headers
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `users_export_${timestamp}.${format}`;

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    }

    // Log admin action
    await auditLogger.logEvent({
      eventType: auditLogger.EVENT_TYPES.ADMIN_BACKUP,
      actor: req.user.id,
      actorId: req.user.id,
      action: 'Exported users',
      resource: 'users',
      details: {
        format,
        filters,
        exportTime: new Date().toISOString(),
      },
      riskLevel: auditLogger.RISK_LEVELS.MEDIUM,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.send(exportData);
  })
);

/**
 * GET /api/users/statistics
 * Get user statistics and analytics
 */
router.get(
  '/statistics',
  requireModerator,
  asyncHandler(async (req, res) => {
    const stats = await userService.getStatistics();

    res.json({
      success: true,
      data: stats,
    });
  })
);

module.exports = router;

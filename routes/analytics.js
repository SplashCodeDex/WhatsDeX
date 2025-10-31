const express = require('express');
const { query, validationResult } = require('express-validator');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { requireModerator } = require('../middleware/auth');
const logger = require('../src/utils/logger');

const router = express.Router();

// Import services (will be created)
const analyticsService = require('../src/services/analyticsService');

/**
 * GET /api/analytics/overview
 * Get system overview analytics
 */
router.get(
  '/overview',
  requireModerator,
  [query('startDate').optional().isISO8601(), query('endDate').optional().isISO8601()],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { startDate, endDate } = req.query;
    const overview = await analyticsService.getSystemOverview({ startDate, endDate });

    res.json({
      success: true,
      data: overview,
    });
  })
);

/**
 * GET /api/analytics/users
 * Get user analytics and metrics
 */
router.get(
  '/users',
  requireModerator,
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('groupBy').optional().isIn(['day', 'week', 'month']),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { startDate, endDate, groupBy = 'day' } = req.query;
    const userAnalytics = await analyticsService.getUserAnalytics({ startDate, endDate, groupBy });

    res.json({
      success: true,
      data: userAnalytics,
    });
  })
);

/**
 * GET /api/analytics/commands
 * Get command usage analytics
 */
router.get(
  '/commands',
  requireModerator,
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { startDate, endDate, limit = 20 } = req.query;
    const commandAnalytics = await analyticsService.getCommandAnalytics({
      startDate,
      endDate,
      limit,
    });

    res.json({
      success: true,
      data: commandAnalytics,
    });
  })
);

/**
 * GET /api/analytics/ai-usage
 * Get AI usage analytics
 */
router.get(
  '/ai-usage',
  requireModerator,
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('groupBy').optional().isIn(['day', 'week', 'month']),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { startDate, endDate, groupBy = 'day' } = req.query;
    const aiAnalytics = await analyticsService.getAIUsageAnalytics({ startDate, endDate, groupBy });

    res.json({
      success: true,
      data: aiAnalytics,
    });
  })
);

/**
 * GET /api/analytics/revenue
 * Get revenue and monetization analytics
 */
router.get(
  '/revenue',
  requireModerator,
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('groupBy').optional().isIn(['day', 'week', 'month']),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { startDate, endDate, groupBy = 'month' } = req.query;
    const revenueAnalytics = await analyticsService.getRevenueAnalytics({
      startDate,
      endDate,
      groupBy,
    });

    res.json({
      success: true,
      data: revenueAnalytics,
    });
  })
);

/**
 * GET /api/analytics/moderation
 * Get moderation analytics
 */
router.get(
  '/moderation',
  requireModerator,
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('groupBy').optional().isIn(['day', 'week', 'month']),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { startDate, endDate, groupBy = 'day' } = req.query;
    const moderationAnalytics = await analyticsService.getModerationAnalytics({
      startDate,
      endDate,
      groupBy,
    });

    res.json({
      success: true,
      data: moderationAnalytics,
    });
  })
);

/**
 * GET /api/analytics/performance
 * Get system performance analytics
 */
router.get(
  '/performance',
  requireModerator,
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('metrics').optional().isArray(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { startDate, endDate, metrics } = req.query;
    const performanceAnalytics = await analyticsService.getPerformanceAnalytics({
      startDate,
      endDate,
      metrics: metrics || ['responseTime', 'cpuUsage', 'memoryUsage', 'errorRate'],
    });

    res.json({
      success: true,
      data: performanceAnalytics,
    });
  })
);

/**
 * GET /api/analytics/geographic
 * Get geographic distribution analytics
 */
router.get(
  '/geographic',
  requireModerator,
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('metric').optional().isIn(['users', 'commands', 'revenue']),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { startDate, endDate, metric = 'users' } = req.query;
    const geographicAnalytics = await analyticsService.getGeographicAnalytics({
      startDate,
      endDate,
      metric,
    });

    res.json({
      success: true,
      data: geographicAnalytics,
    });
  })
);

/**
 * GET /api/analytics/real-time
 * Get real-time analytics data
 */
router.get(
  '/real-time',
  requireModerator,
  asyncHandler(async (req, res) => {
    const realTimeData = await analyticsService.getRealTimeAnalytics();

    res.json({
      success: true,
      data: realTimeData,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/analytics/export
 * Export analytics data
 */
router.get(
  '/export',
  requireModerator,
  [
    query('type').isIn([
      'overview',
      'users',
      'commands',
      'ai-usage',
      'revenue',
      'moderation',
      'performance',
    ]),
    query('format').optional().isIn(['json', 'csv']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { type, format = 'json', startDate, endDate } = req.query;

    const exportData = await analyticsService.exportAnalytics(type, { startDate, endDate, format });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `analytics_${type}_${timestamp}.${format}`;

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.json(exportData);
    } else {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(exportData);
    }
  })
);

/**
 * GET /api/analytics/dashboard
 * Get dashboard analytics summary
 */
router.get(
  '/dashboard',
  requireModerator,
  asyncHandler(async (req, res) => {
    const dashboardData = await analyticsService.getDashboardAnalytics();

    res.json({
      success: true,
      data: dashboardData,
    });
  })
);

/**
 * GET /api/analytics/trends
 * Get trending analytics data
 */
router.get(
  '/trends',
  requireModerator,
  [
    query('period').optional().isIn(['7d', '30d', '90d', '1y']),
    query('metrics').optional().isArray(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { period = '30d', metrics } = req.query;
    const trendsData = await analyticsService.getTrendsAnalytics({
      period,
      metrics: metrics || ['users', 'commands', 'revenue', 'errors'],
    });

    res.json({
      success: true,
      data: trendsData,
    });
  })
);

module.exports = router;

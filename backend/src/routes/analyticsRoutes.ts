import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { AnalyticsController } from '../controllers/analyticsController.js';

const router = express.Router();

/**
 * GET /dashboard
 * Returns aggregated stats for the dashboard
 */
router.get('/dashboard', authenticateToken, AnalyticsController.getDashboardStats);

/**
 * GET /usage
 * Returns historical usage analytics for charts
 */
router.get('/usage', authenticateToken, AnalyticsController.getUsageAnalytics);

/**
 * GET /messages
 * Analytics for message volume over time
 */
router.get('/messages', authenticateToken, AnalyticsController.getMessageAnalytics);

export default router;

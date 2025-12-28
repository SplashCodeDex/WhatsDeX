/**
 * @fileoverview Settings API Routes (ESM)
 * Provides endpoints for system settings management
 */
import express from 'express';
import { body, validationResult } from 'express-validator';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { requireAdmin } from '../middleware/auth.js';
import logger from '../src/utils/logger.js';
import settingsService from '../src/services/settingsService.js';
import auditLogger from '../src/services/auditLogger.js';

const router = express.Router();

/**
 * GET /api/settings
 * Get all system settings
 */
router.get(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const settings = await settingsService.getAllSettings();
    res.json({ success: true, data: settings });
  })
);

/**
 * GET /api/settings/:category
 * Get settings for a specific category
 */
router.get(
  '/:category',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { category } = req.params;
    const settings = await settingsService.getSettingsByCategory(category);

    if (!settings || settings.length === 0) {
      throw new AppError('Settings category not found', 404, 'NOT_FOUND');
    }

    res.json({ success: true, data: settings });
  })
);

/**
 * PUT /api/settings/:category/:key
 * Update a specific setting
 */
router.put(
  '/:category/:key',
  requireAdmin,
  [
    body('value').exists().withMessage('Value is required'),
    body('description').optional().isString().trim(),
  ],
  asyncHandler(async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { category, key } = req.params;
    const { value, description } = req.body;

    const validation = await settingsService.validateSetting(category, key, value);
    if (!validation.valid) {
      throw new AppError(validation.message, 400, 'VALIDATION_ERROR');
    }

    const oldSetting = await settingsService.getSetting(category, key);
    const updatedSetting = await settingsService.updateSetting(
      category,
      key,
      value,
      description,
      req.user.id
    );

    await auditLogger.logEvent({
      eventType: auditLogger.EVENT_TYPES.ADMIN_SYSTEM_CONFIG,
      actor: req.user.id,
      actorId: req.user.id,
      action: 'Updated system setting',
      resource: 'setting',
      resourceId: `${category}.${key}`,
      details: { category, key, oldValue: oldSetting?.value, newValue: value, description },
      riskLevel: auditLogger.RISK_LEVELS.MEDIUM,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({ success: true, data: updatedSetting, message: 'Setting updated successfully' });
  })
);

/**
 * PUT /api/settings/bulk
 * Update multiple settings at once
 */
router.put(
  '/bulk',
  requireAdmin,
  [
    body('settings').isArray({ min: 1 }),
    body('settings.*.category').isString().notEmpty(),
    body('settings.*.key').isString().notEmpty(),
    body('settings.*.value').exists(),
  ],
  asyncHandler(async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { settings } = req.body;
    const results = [];
    const settingErrors = [];

    // Validate all settings first
    for (const setting of settings) {
      const validation = await settingsService.validateSetting(
        setting.category,
        setting.key,
        setting.value
      );
      if (!validation.valid) {
        settingErrors.push({
          category: setting.category,
          key: setting.key,
          error: validation.message,
        });
      }
    }

    if (settingErrors.length > 0) {
      throw new AppError('Some settings failed validation', 400, 'VALIDATION_ERROR', {
        errors: settingErrors,
      });
    }

    // Update all settings
    for (const setting of settings) {
      try {
        const updatedSetting = await settingsService.updateSetting(
          setting.category,
          setting.key,
          setting.value,
          setting.description,
          req.user.id
        );
        results.push(updatedSetting);
      } catch (error) {
        settingErrors.push({ category: setting.category, key: setting.key, error: error.message });
      }
    }

    await auditLogger.logEvent({
      eventType: auditLogger.EVENT_TYPES.ADMIN_SYSTEM_CONFIG,
      actor: req.user.id,
      actorId: req.user.id,
      action: 'Bulk updated system settings',
      resource: 'settings',
      details: { updatedCount: results.length, errorCount: settingErrors.length },
      riskLevel: auditLogger.RISK_LEVELS.HIGH,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      data: { updated: results, errors: settingErrors },
      message: `Updated ${results.length} settings${settingErrors.length > 0 ? `, ${settingErrors.length} failed` : ''}`,
    });
  })
);

export default router;

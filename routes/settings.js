const express = require('express');
const { body, validationResult } = require('express-validator');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { requireAdmin } = require('../middleware/auth');
const logger = require('../src/utils/logger');

const router = express.Router();

// Import services (will be created)
const settingsService = require('../src/services/settingsService');
const auditLogger = require('../src/services/auditLogger');

/**
 * GET /api/settings
 * Get all system settings
 */
router.get('/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const settings = await settingsService.getAllSettings();

    res.json({
      success: true,
      data: settings
    });
  })
);

/**
 * GET /api/settings/:category
 * Get settings for a specific category
 */
router.get('/:category',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { category } = req.params;
    const settings = await settingsService.getSettingsByCategory(category);

    if (!settings || settings.length === 0) {
      throw new AppError('Settings category not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: settings
    });
  })
);

/**
 * PUT /api/settings/:category/:key
 * Update a specific setting
 */
router.put('/:category/:key',
  requireAdmin,
  [
    body('value').exists().withMessage('Value is required'),
    body('description').optional().isString().trim()
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { category, key } = req.params;
    const { value, description } = req.body;

    // Validate the setting before updating
    const validation = await settingsService.validateSetting(category, key, value);
    if (!validation.valid) {
      throw new AppError(validation.message, 400, 'VALIDATION_ERROR');
    }

    const oldSetting = await settingsService.getSetting(category, key);
    const updatedSetting = await settingsService.updateSetting(category, key, value, description, req.user.id);

    // Log admin action
    await auditLogger.logEvent({
      eventType: auditLogger.EVENT_TYPES.ADMIN_SYSTEM_CONFIG,
      actor: req.user.id,
      actorId: req.user.id,
      action: 'Updated system setting',
      resource: 'setting',
      resourceId: `${category}.${key}`,
      details: {
        category,
        key,
        oldValue: oldSetting?.value,
        newValue: value,
        description
      },
      riskLevel: auditLogger.RISK_LEVELS.MEDIUM,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      data: updatedSetting,
      message: 'Setting updated successfully'
    });
  })
);

/**
 * PUT /api/settings/bulk
 * Update multiple settings at once
 */
router.put('/bulk',
  requireAdmin,
  [
    body('settings').isArray({ min: 1 }),
    body('settings.*.category').isString().notEmpty(),
    body('settings.*.key').isString().notEmpty(),
    body('settings.*.value').exists()
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { settings } = req.body;
    const results = [];
    const errors = [];

    // Validate all settings first
    for (const setting of settings) {
      const validation = await settingsService.validateSetting(
        setting.category,
        setting.key,
        setting.value
      );

      if (!validation.valid) {
        errors.push({
          category: setting.category,
          key: setting.key,
          error: validation.message
        });
      }
    }

    if (errors.length > 0) {
      throw new AppError('Some settings failed validation', 400, 'VALIDATION_ERROR', { errors });
    }

    // Update all settings
    for (const setting of settings) {
      try {
        const oldSetting = await settingsService.getSetting(setting.category, setting.key);
        const updatedSetting = await settingsService.updateSetting(
          setting.category,
          setting.key,
          setting.value,
          setting.description,
          req.user.id
        );

        results.push(updatedSetting);
      } catch (error) {
        errors.push({
          category: setting.category,
          key: setting.key,
          error: error.message
        });
      }
    }

    // Log admin action
    await auditLogger.logEvent({
      eventType: auditLogger.EVENT_TYPES.ADMIN_SYSTEM_CONFIG,
      actor: req.user.id,
      actorId: req.user.id,
      action: 'Bulk updated system settings',
      resource: 'settings',
      details: {
        updatedCount: results.length,
        errorCount: errors.length,
        settings: settings.map(s => `${s.category}.${s.key}`)
      },
      riskLevel: auditLogger.RISK_LEVELS.HIGH,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      data: {
        updated: results,
        errors: errors
      },
      message: `Updated ${results.length} settings${errors.length > 0 ? `, ${errors.length} failed` : ''}`
    });
  })
);

/**
 * POST /api/settings/reset/:category
 * Reset settings in a category to defaults
 */
router.post('/reset/:category',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { category } = req.params;

    const resetSettings = await settingsService.resetCategoryToDefaults(category, req.user.id);

    // Log admin action
    await auditLogger.logEvent({
      eventType: auditLogger.EVENT_TYPES.ADMIN_SYSTEM_CONFIG,
      actor: req.user.id,
      actorId: req.user.id,
      action: 'Reset settings category to defaults',
      resource: 'settings',
      resourceId: category,
      details: {
        category,
        resetCount: resetSettings.length,
        resetSettings: resetSettings.map(s => s.key)
      },
      riskLevel: auditLogger.RISK_LEVELS.HIGH,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      data: resetSettings,
      message: `Reset ${resetSettings.length} settings in ${category} category`
    });
  })
);

/**
 * GET /api/settings/export
 * Export all settings
 */
router.get('/export',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const format = req.query.format || 'json';
    const settings = await settingsService.exportSettings(format);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `settings_export_${timestamp}.${format}`;

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    } else {
      // CSV format
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    }

    // Log admin action
    await auditLogger.logEvent({
      eventType: auditLogger.EVENT_TYPES.ADMIN_BACKUP,
      actor: req.user.id,
      actorId: req.user.id,
      action: 'Exported system settings',
      resource: 'settings',
      details: {
        format,
        exportTime: new Date().toISOString()
      },
      riskLevel: auditLogger.RISK_LEVELS.MEDIUM,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.send(settings);
  })
);

/**
 * POST /api/settings/import
 * Import settings from file
 */
router.post('/import',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { settings, format = 'json' } = req.body;

    if (!settings) {
      throw new AppError('Settings data is required', 400, 'VALIDATION_ERROR');
    }

    const importResult = await settingsService.importSettings(settings, format, req.user.id);

    // Log admin action
    await auditLogger.logEvent({
      eventType: auditLogger.EVENT_TYPES.ADMIN_SYSTEM_CONFIG,
      actor: req.user.id,
      actorId: req.user.id,
      action: 'Imported system settings',
      resource: 'settings',
      details: {
        format,
        importedCount: importResult.imported.length,
        errorCount: importResult.errors.length,
        importTime: new Date().toISOString()
      },
      riskLevel: auditLogger.RISK_LEVELS.HIGH,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      data: importResult,
      message: `Imported ${importResult.imported.length} settings${importResult.errors.length > 0 ? `, ${importResult.errors.length} errors` : ''}`
    });
  })
);

/**
 * GET /api/settings/validation/:category/:key
 * Validate a setting value
 */
router.get('/validation/:category/:key',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { category, key } = req.params;
    const { value } = req.query;

    const validation = await settingsService.validateSetting(category, key, value);

    res.json({
      success: true,
      data: {
        category,
        key,
        value,
        valid: validation.valid,
        message: validation.message
      }
    });
  })
);

/**
 * GET /api/settings/categories
 * Get available setting categories
 */
router.get('/categories',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const categories = await settingsService.getCategories();

    res.json({
      success: true,
      data: categories
    });
  })
);

module.exports = router;
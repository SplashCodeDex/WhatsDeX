import express, { Request, Response } from 'express';
import { tenantConfigService } from '../services/tenantConfigService.js';
import logger from '../utils/logger.js';
import { TenantSettingsSchema } from '../types/tenantConfig.js';
import { ZodError } from 'zod';

const router = express.Router();

/**
 * GET /api/tenant/settings
 * Retrieves the current tenant's settings
 */
router.get('/settings', async (req: Request, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }

        const result = await tenantConfigService.getTenantSettings(tenantId);

        if (result.success) {
            res.json({ success: true, data: result.data });
        } else {
            res.status(500).json({ success: false, error: 'Failed to fetch settings' });
        }
    } catch (error: any) {
        logger.error('Route /settings GET error', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * PATCH /api/tenant/settings
 * Updates the current tenant's settings
 */
router.patch('/settings', async (req: Request, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }

        // Partial validation handled by service or manually here?
        // Service expects Partial<TenantSettings>, but let's validate against schema partial
        const parseResult = TenantSettingsSchema.partial().safeParse(req.body);

        if (!parseResult.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: (parseResult as any).error.errors
            });
        }

        const result = await tenantConfigService.updateTenantSettings(tenantId, parseResult.data);

        if (result.success) {
            res.json({ success: true, data: result.data });
        } else {
            res.status(500).json({ success: false, error: 'Failed to update settings' });
        }
    } catch (error: any) {
        logger.error('Route /settings PATCH error', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

export default router;

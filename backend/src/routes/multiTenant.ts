import express, { Request, Response } from 'express';
import multiTenantService from '../services/multiTenantService.js';
import multiTenantBotService from '../services/multiTenantBotService.js';
import logger from '../utils/logger.js';

const router = express.Router();

router.get('/status', (req: Request, res: Response) => {
    res.json({ 
        status: 'ok', 
        message: 'Internal API operational',
        tenantId: req.user?.tenantId 
    });
});

/**
 * Create a new bot for the authenticated tenant
 */
router.post('/bots', async (req: Request, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }

        const result = await multiTenantBotService.createBotInstance(tenantId, req.body);
        
        if (result.success) {
            res.json({ success: true, data: result.data });
        } else {
            res.status(400).json({ success: false, error: result.error.message });
        }
    } catch (error: any) {
        logger.error('Route /bots POST error', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * List all bots for the authenticated tenant
 */
router.get('/bots', async (req: Request, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }

        // Implementation for listing bots from subcollection
        // For now returning current active status from service
        const bots = multiTenantBotService.getActiveBots();
        res.json({ success: true, data: bots });
    } catch (error: any) {
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

export default router;
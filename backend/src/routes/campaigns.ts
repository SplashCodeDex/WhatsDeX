import { Router, Request, Response } from 'express';
import { campaignService } from '../services/campaignService.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * GET /campaigns
 * List all campaigns for the tenant
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const result = await campaignService.getCampaigns(tenantId);
    if (result.success) {
        res.json({ success: true, data: result.data });
    } else {
        res.status(500).json({ success: false, error: result.error?.message || 'Failed to fetch campaigns' });
    }
});

/**
 * POST /campaigns
 * Create a new campaign
 */
router.post('/', authenticateToken, async (req: Request, res: Response) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const result = await campaignService.createCampaign(tenantId, req.body);
    if (result.success) {
        res.status(201).json({ success: true, data: result.data });
    } else {
        res.status(400).json({ success: false, error: result.error?.message || 'Failed to create campaign' });
    }
});

router.post('/:id/start', authenticateToken, async (req: Request, res: Response) => {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;

    if (!tenantId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const result = await campaignService.startCampaign(tenantId, id);
    if (result.success) {
        res.json({ success: true, data: { message: 'Campaign started' } });
    } else {
        res.status(400).json({ success: false, error: result.error?.message || 'Failed to start campaign' });
    }
});

router.post('/:id/pause', authenticateToken, async (req: Request, res: Response) => {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;

    if (!tenantId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const result = await campaignService.pauseCampaign(tenantId, id);
    if (result.success) {
        res.json({ success: true, data: { message: 'Campaign paused' } });
    } else {
        res.status(400).json({ success: false, error: result.error?.message || 'Failed to pause campaign' });
    }
});

router.post('/:id/resume', authenticateToken, async (req: Request, res: Response) => {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;

    if (!tenantId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const result = await campaignService.resumeCampaign(tenantId, id);
    if (result.success) {
        res.json({ success: true, data: { message: 'Campaign resumed' } });
    } else {
        res.status(400).json({ success: false, error: result.error?.message || 'Failed to resume campaign' });
    }
});

router.post('/:id/duplicate', authenticateToken, async (req: Request, res: Response) => {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;

    if (!tenantId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const result = await campaignService.duplicateCampaign(tenantId, id);
    if (result.success) {
        res.status(201).json({ success: true, data: result.data });
    } else {
        res.status(500).json({ success: false, error: result.error?.message || 'Failed to duplicate campaign' });
    }
});

router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;

    if (!tenantId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const result = await campaignService.deleteCampaign(tenantId, id);
    if (result.success) {
        res.json({ success: true, data: { message: 'Campaign deleted' } });
    } else {
        res.status(500).json({ success: false, error: result.error?.message || 'Failed to delete campaign' });
    }
});

export default router;

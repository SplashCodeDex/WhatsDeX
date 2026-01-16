import { Router } from 'express';
import { campaignService } from '../services/campaignService.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * GET /campaigns
 * List all campaigns for the tenant
 */
router.get('/', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) return res.status(400).json({ success: false, error: 'Missing tenant ID' });

    const result = await campaignService.getCampaigns(tenantId);
    if (result.success) {
        res.json(result);
    } else {
        res.status(500).json(result);
    }
});

/**
 * POST /campaigns
 * Create a new campaign
 */
router.post('/', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) return res.status(400).json({ success: false, error: 'Missing tenant ID' });

    const result = await campaignService.createCampaign(tenantId, req.body);
    if (result.success) {
        res.status(201).json(result);
    } else {
        res.status(400).json(result);
    }
});

/**
 * POST /campaigns/:id/start
 * Trigger campaign execution
 */
router.post('/:id/start', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { id } = req.params;

    if (!tenantId) return res.status(400).json({ success: false, error: 'Missing tenant ID' });

    const result = await campaignService.startCampaign(tenantId, id);
    if (result.success) {
        res.json(result);
    } else {
        res.status(400).json(result);
    }
});

/**
 * DELETE /campaigns/:id
 * Delete a campaign
 */
router.delete('/:id', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { id } = req.params;

    if (!tenantId) return res.status(400).json({ success: false, error: 'Missing tenant ID' });

    const result = await campaignService.deleteCampaign(tenantId, id);
    if (result.success) {
        res.json(result);
    } else {
        res.status(500).json(result);
    }
});

export default router;

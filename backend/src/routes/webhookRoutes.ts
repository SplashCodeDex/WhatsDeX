import { Router } from 'express';
import { webhookService } from '../services/webhookService.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * GET /api/webhooks
 * List all webhooks for the tenant
 */
router.get('/', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) return res.status(400).json({ success: false, error: 'Missing tenant ID' });

    const result = await webhookService.getWebhooks(tenantId);
    if (result.success) {
        res.json(result);
    } else {
        res.status(500).json(result);
    }
});

/**
 * POST /api/webhooks
 * Create a new webhook
 */
router.post('/', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) return res.status(400).json({ success: false, error: 'Missing tenant ID' });

    const result = await webhookService.createWebhook(tenantId, req.body);
    if (result.success) {
        res.status(201).json(result);
    } else {
        res.status(400).json(result);
    }
});

/**
 * DELETE /api/webhooks/:id
 * Delete a webhook
 */
router.delete('/:id', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { id } = req.params;

    if (!tenantId) return res.status(400).json({ success: false, error: 'Missing tenant ID' });

    const result = await webhookService.deleteWebhook(tenantId, id);
    if (result.success) {
        res.json(result);
    } else {
        res.status(500).json(result);
    }
});

export default router;

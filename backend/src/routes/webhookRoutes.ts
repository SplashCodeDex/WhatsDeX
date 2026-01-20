import { Router, Request, Response } from 'express';
import { webhookService } from '../services/webhookService.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * GET /api/webhooks
 * List all webhooks for the tenant
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const result = await webhookService.getWebhooks(tenantId);
    if (result.success) {
        res.json({ success: true, data: result.data });
    } else {
        res.status(500).json({ success: false, error: result.error?.message || 'Failed to fetch webhooks' });
    }
});

/**
 * POST /api/webhooks
 * Create a new webhook
 */
router.post('/', authenticateToken, async (req: Request, res: Response) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const result = await webhookService.createWebhook(tenantId, req.body);
    if (result.success) {
        res.status(201).json({ success: true, data: result.data });
    } else {
        res.status(400).json({ success: false, error: result.error?.message || 'Failed to create webhook' });
    }
});

router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
    const tenantId = req.user?.tenantId;
    const id = req.params.id as string;

    if (!tenantId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const result = await webhookService.deleteWebhook(tenantId, id);
    if (result.success) {
        res.json({ success: true, data: { message: 'Webhook deleted' } });
    } else {
        res.status(500).json({ success: false, error: result.error?.message || 'Failed to delete webhook' });
    }
});

export default router;

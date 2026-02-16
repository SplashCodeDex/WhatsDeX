import { Router, Request, Response } from 'express';
import { channelManager } from '../services/channels/ChannelManager.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * POST /api/telegram/webhook/:token
 * Handle incoming Telegram updates routed by bot token
 */
router.post('/webhook/:token', async (req: Request, res: Response) => {
    const token = req.params.token as string;

    // Security: Only allow if token matches a registered adapter
    const adapter = channelManager.getAdapter(token);

    if (!adapter) {
        logger.warn(`[TelegramWebhook] Received webhook for unknown token: ${token}`);
        // Return 200 to stop Telegram from retrying, but log warning
        // Or 404 if we want to be strict (but Telegram might retry)
        // Best practice: 200 OK after logging.
        return res.status(200).send('OK (Unknown Bot)');
    }

    if (adapter.id !== 'telegram') {
        logger.warn(`[TelegramWebhook] Token matches non-telegram adapter: ${adapter.id}`);
        return res.status(400).send('Invalid protocol');
    }

    if (!adapter.handleWebhook) {
        logger.error(`[TelegramWebhook] Adapter ${adapter.id} does not implement handleWebhook`);
        return res.status(500).send('Webhook handler not implemented');
    }

    try {
        await adapter.handleWebhook(req, res);
    } catch (error) {
        logger.error(`[TelegramWebhook] Error handling webhook for ${token}:`, error);
        // grammY handles responses, but if it fails, ensure we send something
        if (!res.headersSent) {
            res.status(500).send('Internal Server Error');
        }
    }
});

export default router;

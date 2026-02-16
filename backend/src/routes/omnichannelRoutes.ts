import express, { Request, Response } from 'express';
import multiTenantBotService from '../services/multiTenantBotService.js';
import { channelManager } from '../services/channels/ChannelManager.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /omnichannel/status
 * Get the status of all connected channels for the tenant
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const botsResult = await multiTenantBotService.getAllBots(tenantId);
    if (!botsResult.success) {
      return res.status(500).json({ success: false, error: botsResult.error.message });
    }

    const channels = botsResult.data.map(bot => {
      const adapter = channelManager.getAdapter(bot.id);
      return {
        id: bot.id,
        name: bot.name,
        type: bot.type,
        status: bot.status,
        account: bot.phoneNumber || bot.identifier || null,
        lastActiveAt: bot.lastSeenAt
      };
    });

    res.json({ success: true, data: channels });
  } catch (error: any) {
    logger.error('Route /omnichannel/status GET error', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;

import express, { Request, Response } from 'express';
import multiTenantBotService from '../services/multiTenantBotService.js';
import { channelManager } from '../services/channels/ChannelManager.js';
import { OpenClawGateway } from '../services/openClawGateway.js';
import logger from '../utils/logger.js';

const router = express.Router();
const gateway = OpenClawGateway.getInstance();

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

/**
 * GET /omnichannel/skills/report
 */
router.get('/skills/report', async (req: Request, res: Response) => {
  try {
    const report = await gateway.getSkillReport();
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch skill report' });
  }
});

/**
 * GET /omnichannel/agents
 */
router.get('/agents', async (req: Request, res: Response) => {
  try {
    logger.info('GET /omnichannel/agents request received');
    const agents = await gateway.getAgents();
    logger.info(`GET /omnichannel/agents success: ${Array.isArray(agents.agents) ? agents.agents.length : 0} agents found`);
    res.json({ success: true, data: agents });
  } catch (error: any) {
    logger.error('GET /omnichannel/agents error', error);
    res.status(500).json({ success: false, error: 'Failed to fetch agents', details: error.message });
  }
});

/**
 * GET /omnichannel/cron/jobs
 */
router.get('/cron/jobs', async (req: Request, res: Response) => {
  try {
    // Placeholder for now as we need to bridge cron service
    res.json({ success: true, data: [] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch cron jobs' });
  }
});

/**
 * GET /omnichannel/gateway/health
 */
router.get('/gateway/health', async (req: Request, res: Response) => {
  try {
    const health = await gateway.getHealth();
    res.json({ success: true, data: health });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch gateway health' });
  }
});

export default router;

import express, { Request, Response } from 'express';
import multiTenantService from '../services/multiTenantService.js';
import agentService from '../services/AgentService.js';
import channelService from '../services/ChannelService.js';
import multiTenantBotService from '../archive/multiTenantBotService.js';
import logger from '../utils/logger.js';
import initializeContext from '../lib/context.js';

const router = express.Router();

router.get('/status', (req: Request, res: Response) => {
    res.json({
        success: true,
        data: {
            status: 'ok',
            message: 'Internal API operational',
            tenantId: req.user?.tenantId
        }
    });
});

/**
 * --- AGENT ROUTES ---
 */

/**
 * List all agents for the authenticated tenant
 */
router.get('/agents', async (req: Request, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }

        const result = await multiTenantService.getAgents(tenantId);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * Create a new agent
 */
router.post('/agents', async (req: Request, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }

        const result = await agentService.createAgent(tenantId, req.body);
        if (result.success) {
            res.json({ success: true, data: result.data });
        } else {
            res.status(400).json({ success: false, error: result.error.message });
        }
    } catch (error: any) {
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * Delete an agent (and cascade)
 */
router.delete('/agents/:id', async (req: Request, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }

        const result = await agentService.deleteAgent(tenantId, req.params.id);
        if (result.success) {
            res.json({ success: true, data: { message: 'Agent deleted' } });
        } else {
            res.status(400).json({ success: false, error: result.error.message });
        }
    } catch (error: any) {
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * --- HIERARCHICAL CHANNEL ROUTES ---
 */

/**
 * Create a new channel under an agent
 */
router.post('/agents/:agentId/channels', async (req: Request, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        const agentId = req.params.agentId;
        if (!tenantId) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }

        const result = await channelService.createChannel(tenantId, req.body, agentId);

        if (result.success) {
            res.json({ success: true, data: result.data });
        } else {
            res.status(400).json({ success: false, error: result.error.message });
        }
    } catch (error: any) {
        logger.error('Route /agents/:agentId/channels POST error', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * List all channels for a specific agent
 */
router.get('/agents/:agentId/channels', async (req: Request, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        const agentId = req.params.agentId;
        if (!tenantId) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }

        const result = await channelService.getChannelsForAgent(tenantId, agentId);

        if (result.success) {
            const channels = result.data.map(chan => ({
                id: chan.id,
                name: chan.name,
                type: chan.type,
                status: chan.status,
                assignedAgentId: chan.assignedAgentId
            }));
            res.json({ success: true, data: channels });
        } else {
            res.status(500).json({ success: false, error: result.error?.message });
        }
    } catch (error: any) {
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * Legacy support for top-level /bots (Mapped to system_default agent)
 */
router.get(['/channels', '/bots'], async (req: Request, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }

        // Return channels from system_default agent for legacy UI compatibility
        const result = await channelService.getChannelsForAgent(tenantId, 'system_default');

        if (result.success) {
            const channels = result.data.map(chan => ({
                id: chan.id,
                name: chan.name,
                phoneNumber: chan.phoneNumber || null,
                status: chan.status,
                messageCount: (chan.stats?.messagesSent || 0) + (chan.stats?.messagesReceived || 0),
                lastActiveAt: chan.updatedAt || null,
                assignedAgentId: chan.assignedAgentId || null
            }));
            res.json({ success: true, data: channels });
        } else {
            res.status(500).json({ success: false, error: result.error?.message });
        }
    } catch (error: any) {
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * Get a single channel by ID
 */
router.get(['/agents/:agentId/channels/:id', '/bots/:botId'], async (req: Request, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        const agentId = req.params.agentId || 'system_default';
        const id = (req.params.id || req.params.botId) as string;
        if (!tenantId) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }

        const result = await channelService.getChannel(tenantId, id, agentId);
        if (result.success) {
            res.json({ success: true, data: result.data });
        } else {
            res.status(404).json({ success: false, error: result.error?.message || 'Channel not found' });
        }
    } catch (error: any) {
        logger.error('Route /agents/:agentId/channels/:id GET error', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * Update a channel
 */
router.patch(['/agents/:agentId/channels/:id', '/bots/:botId'], async (req: Request, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        const agentId = req.params.agentId || 'system_default';
        const id = (req.params.id || req.params.botId) as string;
        if (!tenantId) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }

        const result = await channelService.updateChannel(tenantId, id, req.body, agentId);
        if (result.success) {
            res.json({ success: true, data: result.data });
        } else {
            res.status(400).json({ success: false, error: result.error?.message || 'Update failed' });
        }
    } catch (error: any) {
        logger.error('Route /agents/:agentId/channels/:id PATCH error', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * Delete a channel
 */
router.delete(['/agents/:agentId/channels/:id', '/bots/:botId'], async (req: Request, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        const agentId = req.params.agentId || 'system_default';
        const id = (req.params.id || req.params.botId) as string;
        if (!tenantId) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }

        const result = await channelService.deleteChannel(tenantId, id, agentId);
        if (result.success) {
            res.json({ success: true, data: { message: 'Channel deleted successfully' } });
        } else {
            res.status(400).json({ success: false, error: result.error?.message || 'Delete failed' });
        }
    } catch (error: any) {
        logger.error('Route /agents/:agentId/channels/:id DELETE error', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * Get available bot commands grouped by category
 */
router.get('/agents/:agentId/commands', async (req: Request, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }

        const context = await initializeContext();
        const commands = context.commandSystem.getCategorizedCommands();

        res.json({ success: true, data: commands });
    } catch (error: any) {
        logger.error('Route /agents/:agentId/commands GET error', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * Connect a channel (starts QR generation)
 */
router.post(['/agents/:agentId/channels/:id/connect', '/bots/:botId/connect'], async (req: Request, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        const agentId = req.params.agentId || 'system_default';
        const id = (req.params.id || req.params.botId) as string;
        if (!tenantId) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }

        const result = await multiTenantBotService.startBot(tenantId, id);
        if (result.success) {
            res.json({ success: true, data: { message: 'Connection initiated' } });
        } else {
            res.status(400).json({ success: false, error: result.error?.message || 'Connection failed' });
        }
    } catch (error: any) {
        logger.error('Route connect POST error', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * Disconnect a channel
 */
router.post(['/agents/:agentId/channels/:id/disconnect', '/bots/:botId/disconnect'], async (req: Request, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        const id = (req.params.id || req.params.botId) as string;
        if (!tenantId) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }

        const result = await multiTenantBotService.stopBot(id);
        if (result.success) {
            res.json({ success: true, data: { message: 'Disconnected successfully' } });
        } else {
            res.status(400).json({ success: false, error: result.error?.message || 'Disconnect failed' });
        }
    } catch (error: any) {
        logger.error('Route disconnect POST error', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * Get QR code for channel connection
 */
router.get(['/agents/:agentId/channels/:id/qr', '/bots/:botId/qr'], async (req: Request, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        const id = (req.params.id || req.params.botId) as string;
        if (!tenantId) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }

        // Ensure bot is started/connecting to generate QR
        if (!multiTenantBotService.hasActiveBot(id)) {
            await multiTenantBotService.startBot(tenantId, id);
        }

        const qrCode = multiTenantBotService.getBotQR(id);
        if (qrCode) {
            res.json({ success: true, data: { qrCode } });
        } else {
            res.json({ success: true, data: { qrCode: null, message: 'QR code not yet available, please wait...' } });
        }
    } catch (error: any) {
        logger.error('Route qr GET error', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * Get Pairing Code for channel
 */
router.post(['/agents/:agentId/channels/:id/pairing-code', '/bots/:botId/pairing-code'], async (req: Request, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        const id = (req.params.id || req.params.botId) as string;
        const { phoneNumber } = req.body;

        if (!tenantId) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }
        if (!phoneNumber) {
            return res.status(400).json({ success: false, error: 'Phone number is required' });
        }

        const result = await multiTenantBotService.requestPairingCode(tenantId, id, phoneNumber);

        if (result.success) {
            res.json({ success: true, data: { pairingCode: result.data } });
        } else {
            res.status(400).json({ success: false, error: result.error?.message || 'Failed to get pairing code' });
        }
    } catch (error: any) {
        logger.error('Route pairing-code POST error', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * Get channel status
 */
router.get(['/agents/:agentId/channels/:id/status', '/bots/:botId/status'], async (req: Request, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        const id = (req.params.id || req.params.botId) as string;
        if (!tenantId) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }

        const isActive = multiTenantBotService.hasActiveBot(id);
        const hasQR = !!multiTenantBotService.getBotQR(id);

        res.json({
            success: true,
            data: {
                id: id,
                status: isActive ? (hasQR ? 'connecting' : 'connected') : 'disconnected',
                isActive,
                hasQR
            }
        });
    } catch (error: any) {
        logger.error('Route status GET error', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

export default router;

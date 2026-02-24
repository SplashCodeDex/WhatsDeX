import express, { Request, Response } from 'express';
import multiTenantService from '../services/multiTenantService.js';
import multiTenantBotService from '../services/multiTenantBotService.js';
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

        // Implementation for listing bots from Firestore (persistent state)
        const result = await multiTenantBotService.getAllBots(tenantId);

        if (result.success) {
            // Map to frontend BotListItem shape
            const bots = result.data.map(bot => ({
                id: bot.id,
                name: bot.name,
                phoneNumber: bot.phoneNumber || null,
                status: bot.status,
                messageCount: (bot.stats?.messagesSent || 0) + (bot.stats?.messagesReceived || 0),
                lastActiveAt: bot.updatedAt || null
            }));
            res.json({ success: true, data: bots });
        } else {
            res.status(500).json({ success: false, error: result.error?.message });
        }
    } catch (error: any) {
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * Get available bot commands grouped by category
 */
router.get('/bots/commands', async (req: Request, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }

        const context = await initializeContext();
        const commands = context.commandSystem.getCategorizedCommands();

        res.json({ success: true, data: commands });
    } catch (error: any) {
        logger.error('Route /bots/commands GET error', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * Get a single bot by ID
 */
router.get('/bots/:botId', async (req: Request, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        const botId = req.params.botId as string;
        if (!tenantId) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }

        const result = await multiTenantBotService.getBot(tenantId, botId);
        if (result.success) {
            res.json({ success: true, data: result.data });
        } else {
            res.status(404).json({ success: false, error: result.error?.message || 'Bot not found' });
        }
    } catch (error: any) {
        logger.error('Route /bots/:botId GET error', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * Update a bot
 */
router.patch('/bots/:botId', async (req: Request, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        const botId = req.params.botId as string;
        if (!tenantId) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }

        const result = await multiTenantBotService.updateBot(tenantId, botId, req.body);
        if (result.success) {
            res.json({ success: true, data: result.data });
        } else {
            res.status(400).json({ success: false, error: result.error?.message || 'Update failed' });
        }
    } catch (error: any) {
        logger.error('Route /bots/:botId PATCH error', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * Delete a bot
 */
router.delete('/bots/:botId', async (req: Request, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        const botId = req.params.botId as string;
        if (!tenantId) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }

        const result = await multiTenantBotService.deleteBot(tenantId, botId);
        if (result.success) {
            res.json({ success: true, data: { message: 'Bot deleted successfully' } });
        } else {
            res.status(400).json({ success: false, error: result.error?.message || 'Delete failed' });
        }
    } catch (error: any) {
        logger.error('Route /bots/:botId DELETE error', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * Connect a bot (starts QR generation)
 */
router.post('/bots/:botId/connect', async (req: Request, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        const botId = req.params.botId as string;
        if (!tenantId) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }

        const result = await multiTenantBotService.startBot(tenantId, botId);
        if (result.success) {
            res.json({ success: true, data: { message: 'Bot connection initiated' } });
        } else {
            res.status(400).json({ success: false, error: result.error?.message || 'Connection failed' });
        }
    } catch (error: any) {
        logger.error('Route /bots/:botId/connect POST error', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * Disconnect a bot
 */
router.post('/bots/:botId/disconnect', async (req: Request, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        const botId = req.params.botId as string;
        if (!tenantId) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }

        const result = await multiTenantBotService.stopBot(botId);
        if (result.success) {
            res.json({ success: true, data: { message: 'Bot disconnected successfully' } });
        } else {
            res.status(400).json({ success: false, error: result.error?.message || 'Disconnect failed' });
        }
    } catch (error: any) {
        logger.error('Route /bots/:botId/disconnect POST error', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * Get QR code for bot connection
 */
router.get('/bots/:botId/qr', async (req: Request, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        const botId = req.params.botId as string;
        if (!tenantId) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }

        // Ensure bot is started/connecting to generate QR
        if (!multiTenantBotService.hasActiveBot(botId)) {
            await multiTenantBotService.startBot(tenantId, botId);
        }

        const qrCode = multiTenantBotService.getBotQR(botId);
        if (qrCode) {
            res.json({ success: true, data: { qrCode } });
        } else {
            res.json({ success: true, data: { qrCode: null, message: 'QR code not yet available, please wait...' } });
        }
    } catch (error: any) {
        logger.error('Route /bots/:botId/qr GET error', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * Get Pairing Code for bot
 */
router.post('/bots/:botId/pairing-code', async (req: Request, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        const botId = req.params.botId as string;
        const { phoneNumber } = req.body;

        if (!tenantId) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }
        if (!phoneNumber) {
            return res.status(400).json({ success: false, error: 'Phone number is required' });
        }

        const result = await multiTenantBotService.requestPairingCode(tenantId, botId, phoneNumber);

        if (result.success) {
            res.json({ success: true, data: { pairingCode: result.data } });
        } else {
            res.status(400).json({ success: false, error: result.error?.message || 'Failed to get pairing code' });
        }
    } catch (error: any) {
        logger.error('Route /bots/:botId/pairing-code POST error', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * Get bot status
 */
router.get('/bots/:botId/status', async (req: Request, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        const botId = req.params.botId as string;
        if (!tenantId) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }

        const isActive = multiTenantBotService.hasActiveBot(botId);
        const hasQR = !!multiTenantBotService.getBotQR(botId);

        res.json({
            success: true,
            data: {
                id: botId,
                status: isActive ? (hasQR ? 'connecting' : 'connected') : 'disconnected',
                isActive,
                hasQR
            }
        });
    } catch (error: any) {
        logger.error('Route /bots/:botId/status GET error', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

export default router;

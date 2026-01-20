import express, { Request, Response } from 'express';
import { db } from '../lib/firebase.js'; // Ensure correct import path
import logger from '../utils/logger.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /dashboard
 * Returns aggregated stats for the dashboard:
 * - Active Bots count
 * - Total Messages (aggregated from all bots)
 * - Total Contacts
 * - System Health status
 */
router.get('/dashboard', authenticateToken, async (req: Request, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }

        // 1. Fetch Bots for this tenant
        // Using correct path: tenants/{tenantId}/bots
        const botsSnapshot = await db.collection('tenants')
            .doc(tenantId)
            .collection('bots')
            .get();

        const bots = botsSnapshot.docs.map(doc => doc.data());
        const totalBots = bots.length;
        const activeBots = bots.filter(b => b.status === 'connected' || b.status === 'connecting').length;

        // 2. Calculate Message Stats (if messages are stored in subcollection)
        // This is expensive if we count documents. For now, we sum 'messageCount' from bot metadata if available.
        // Or we use a lightweight counter if one exists.
        // Fallback: 0 if no stats available yet.
        let totalMessages = 0;
        bots.forEach(bot => {
            if (bot.stats && typeof bot.stats === 'object') {
                totalMessages += (bot.stats.messagesSent || 0) + (bot.stats.messagesReceived || 0);
            }
        });

        // 3. Fetch Contacts Count
        // tenants/{tenantId}/contacts
        // Using count() aggregation for performance if available, otherwise get().size
        // Firestore Node SDK supports count() aggregation query.
        const contactsQuery = db.collection('tenants')
            .doc(tenantId)
            .collection('contacts');

        const contactsSnapshot = await contactsQuery.count().get();
        const totalContacts = contactsSnapshot.data().count;

        res.json({
            success: true,
            data: {
                totalBots,
                activeBots,
                totalMessages,
                totalContacts,
                systemHealth: '99.9%' // Placeholder for now, could check Redis/services
            }
        });

    } catch (error: any) {
        logger.error('Route /analytics/dashboard GET error', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * GET /messages
 * Analytics for message volume over time (chart data)
 * TODO: Implement when we have message metrics stored
 */
router.get('/messages', authenticateToken, async (req: Request, res: Response) => {
    res.json({ success: true, data: [] });
});

export default router;

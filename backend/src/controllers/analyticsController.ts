import { Request, Response } from 'express';
import { db } from '../lib/firebase.js';
import logger from '../utils/logger.js';
import monitoringService from '../services/monitoring.js';

export class AnalyticsController {
    /**
     * Get dashboard statistics
     */
    static async getDashboardStats(req: Request, res: Response) {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) {
                return res.status(401).json({ success: false, error: 'Authentication required' });
            }

            // 1. Fetch Bots for this tenant
            const botsSnapshot = await db.collection('tenants')
                .doc(tenantId)
                .collection('bots')
                .get();

            const bots = botsSnapshot.docs.map(doc => doc.data());
            const totalBots = bots.length;
            const activeBots = bots.filter(b => b.status === 'connected' || b.status === 'connecting').length;

            // 2. Calculate Message Stats
            let totalMessages = 0;
            bots.forEach(bot => {
                if (bot.stats && typeof bot.stats === 'object') {
                    totalMessages += (bot.stats.messagesSent || 0) + (bot.stats.messagesReceived || 0);
                }
            });

            // 3. Fetch Contacts Count
            const contactsQuery = db.collection('tenants')
                .doc(tenantId)
                .collection('contacts');

            const contactsSnapshot = await contactsQuery.count().get();
            const totalContacts = contactsSnapshot.data().count;

            const metrics = await monitoringService.getMetrics();

            res.json({
                success: true,
                data: {
                    totalBots,
                    activeBots,
                    totalMessages,
                    totalContacts,
                    systemHealth: metrics.responseTimes.avg < 1000 ? 'Healthy' : 'Degraded',
                    metrics: metrics.systemHealth
                }
            });

        } catch (error: any) {
            logger.error('AnalyticsController.getDashboardStats error', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    /**
     * Get message analytics (placeholder)
     */
    static async getMessageAnalytics(req: Request, res: Response) {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) {
                return res.status(401).json({ success: false, error: 'Authentication required' });
            }

            // Basic aggregation: Get counts for last 7 days
            const end = new Date();
            const start = new Date();
            start.setDate(start.getDate() - 7);

            // Note: In a real production app, we would use a dedicated 'analytics' collection
            // where we pre-aggregate stats daily to avoid heavy queries.
            // For now, we return a simulated timestamp structure based on bot stats.

            const botsSnapshot = await db.collection('tenants')
                .doc(tenantId)
                .collection('bots')
                .get();

            const bots = botsSnapshot.docs.map(doc => doc.data());
            const totalSent = bots.reduce((acc, bot) => acc + (bot.stats?.messagesSent || 0), 0);
            const totalReceived = bots.reduce((acc, bot) => acc + (bot.stats?.messagesReceived || 0), 0);

            res.json({
                success: true,
                data: [
                    { date: start.toISOString(), sent: 0, received: 0 },
                    { date: end.toISOString(), sent: totalSent, received: totalReceived }
                ]
            });
        } catch (error: any) {
            logger.error('AnalyticsController.getMessageAnalytics error', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }
}

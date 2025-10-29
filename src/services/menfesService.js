const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../utils/logger');
// Assume a cache service is available for rate limiting
// const cache = require('./cacheService');

class MenfesService {
    constructor() {
        this.cleanup();
    }

    async startMenfesSession(fromUserId, toJid, fakeName) {
        const tenMinutesFromNow = new Date(Date.now() + 10 * 60 * 1000);

        // Ensure the target user exists, create if not
        let toUser = await prisma.user.findUnique({ where: { jid: toJid } });
        if (!toUser) {
            toUser = await prisma.user.create({ data: { jid: toJid, name: 'Menfess Target' } });
        }
        const toUserId = toUser.id;

        // Check for existing active sessions for either user
        const existingSession = await prisma.menfessSession.findFirst({
            where: {
                isActive: true,
                OR: [{ fromUserId }, { toUserId }],
            },
        });

        if (existingSession) {
            throw new Error('One of the users is already in an active menfes session.');
        }

        const session = await prisma.menfessSession.create({
            data: {
                fromUserId,
                toUserId,
                fakeName: fakeName || 'Anonymous',
                expiresAt: tenMinutesFromNow,
            },
        });

        logger.info('Menfes session started', { sessionId: session.id });
        return session;
    }

    async sendMenfesMessage(fromUserId, message) {
        const session = await this.getActiveSession(fromUserId);
        if (!session) {
            throw new Error('No active menfes session found.');
        }

        // The recipient is the other user in the session
        const toUserId = session.fromUserId === fromUserId ? session.toUserId : session.fromUserId;

        const menfessMessage = await prisma.menfess.create({
            data: {
                fromUserId,
                toUserId,
                message: message.text, // Assuming message object has a text property
                mediaUrl: message.mediaUrl,
                mediaType: message.mediaType,
            },
        });

        await prisma.menfessSession.update({
            where: { id: session.id },
            data: { messageCount: { increment: 1 } },
        });

        return menfessMessage;
    }

    async endMenfesSession(userId) {
        const session = await this.getActiveSession(userId);
        if (!session) {
            throw new Error('No active menfes session found.');
        }

        await prisma.menfessSession.update({
            where: { id: session.id },
            data: { isActive: false },
        });

        logger.info('Menfes session ended', { sessionId: session.id });
        return { success: true, message: 'Session ended successfully.' };
    }

    async getActiveSession(userId) {
        return prisma.menfessSession.findFirst({
            where: {
                isActive: true,
                expiresAt: { gt: new Date() },
                OR: [{ fromUserId: userId }, { toUserId: userId }],
            },
        });
    }

    async cleanup() {
        // Deactivate sessions that have expired
        const expiredSessions = await prisma.menfessSession.updateMany({
            where: {
                isActive: true,
                expiresAt: { lt: new Date() },
            },
            data: { isActive: false },
        });
        if (expiredSessions.count > 0) {
            logger.info(`Cleaned up ${expiredSessions.count} expired menfes sessions.`);
        }
    }
}

module.exports = new MenfesService();

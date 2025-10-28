const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../utils/logger');

class SessionManager {
  async createSession(userId, deviceInfo = {}) {
    const session = await prisma.userSession.create({
      data: {
        userId,
        ipAddress: deviceInfo.ip,
        userAgent: deviceInfo.userAgent,
        platform: deviceInfo.platform,
      },
    });
    logger.info('Session created', { sessionId: session.id, userId });
    return session;
  }

  async getSession(sessionId) {
    return prisma.userSession.findUnique({
      where: { id: sessionId },
    });
  }

  async endSession(sessionId) {
    const session = await this.getSession(sessionId);
    if (!session) {
      return null;
    }

    const duration = Math.round((new Date() - session.startedAt) / 1000);
    const updatedSession = await prisma.userSession.update({
      where: { id: sessionId },
      data: {
        endedAt: new Date(),
        duration,
      },
    });
    logger.info('Session ended', { sessionId });
    return updatedSession;
  }

  async getUserSessions(userId) {
    return prisma.userSession.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
    });
  }

  async cleanupExpiredSessions() {
    // This can be handled by a cron job or a periodic task
    // For now, this is a placeholder
    logger.info('Running session cleanup...');
  }
}

module.exports = new SessionManager();

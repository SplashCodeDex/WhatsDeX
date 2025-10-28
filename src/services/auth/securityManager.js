const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../../utils/logger');

class SecurityManager {
    constructor() {
        logger.info('SecurityManager initialized');
    }

    async verifyPairingCode(userId, code) {
        if (await this.detectAnomalies(userId)) {
            await this.alertSecurityIssue(`Multiple failed login attempts for user ${userId}`);
            return false;
        }

        // This is still a placeholder for actual code verification logic
        const isValid = true; 

        if (!isValid) {
            await this.recordFailedLogin(userId);
        }

        return isValid;
    }

    async detectAnomalies(userId) {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const failedAttempts = await prisma.auditLog.count({
            where: {
                actorId: userId,
                eventType: 'SECURITY_LOGIN_FAILURE',
                createdAt: {
                    gte: oneHourAgo,
                },
            },
        });

        if (failedAttempts > 5) {
            logger.warn(`Anomaly detected for user ${userId}: ${failedAttempts} failed login attempts in the last hour`);
            return true;
        }
        return false;
    }

    async recordFailedLogin(userId) {
        await prisma.auditLog.create({
            data: {
                eventType: 'SECURITY_LOGIN_FAILURE',
                actorId: userId,
                action: 'Failed pairing code verification',
                resource: 'authentication',
                riskLevel: 'MEDIUM',
            },
        });
    }

    async alertSecurityIssue(issue) {
        logger.warn('Security issue detected', { issue });
    }
}

module.exports = SecurityManager;

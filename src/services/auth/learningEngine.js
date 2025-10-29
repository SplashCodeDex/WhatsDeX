const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../../utils/logger');

class LearningEngine {
    constructor(unifiedAuth) {
        this.unifiedAuth = unifiedAuth;
        logger.info('LearningEngine initialized with persistent storage');
    }

    async recordAuthResult(result) {
        await prisma.authAttemptLog.create({
            data: {
                method: result.method,
                success: result.success,
                duration: result.duration,
                userAgent: result.userAgent,
            },
        });

        // Optimization can be run periodically instead of on every attempt
        // For this refactor, we'll keep the logic but it could be moved
        // to a cron job or a less frequent trigger.
        const attemptCount = await prisma.authAttemptLog.count();
        if (attemptCount > 100) { // Trigger optimization after 100 attempts
            await this.optimizeBasedOnLearning();
        }
    }

    async optimizeBasedOnLearning() {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const attempts = await prisma.authAttemptLog.findMany({
            where: { createdAt: { gte: thirtyDaysAgo } },
        });

        if (attempts.length < 100) {
            return; // Not enough data
        }

        const stats = attempts.reduce((acc, attempt) => {
            if (!acc[attempt.method]) {
                acc[attempt.method] = { totalDuration: 0, totalAttempts: 0, successful: 0 };
            }
            acc[attempt.method].totalDuration += attempt.duration;
            acc[attempt.method].totalAttempts++;
            if (attempt.success) {
                acc[attempt.method].successful++;
            }
            return acc;
        }, {});

        const avgDurations = {};
        for (const method in stats) {
            avgDurations[method] = stats[method].totalDuration / stats[method].totalAttempts;
        }

        // This assumes `this.unifiedAuth.config.auth.methods` is accessible and mutable.
        // In a real-world scenario, this might update a setting in the database.
        this.unifiedAuth.config.auth.methods.sort((a, b) => {
            const durationA = avgDurations[a] || Infinity;
            const durationB = avgDurations[b] || Infinity;
            return durationA - durationB;
        });

        logger.info('Optimized auth methods based on learning', {
            newOrder: this.unifiedAuth.config.auth.methods,
        });

        // Optionally, clear old log entries
        await prisma.authAttemptLog.deleteMany({
            where: { createdAt: { lt: thirtyDaysAgo } },
        });
    }
}

module.exports = LearningEngine;

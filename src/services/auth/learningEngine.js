const logger = require('../../utils/logger');

class LearningEngine {
    constructor(unifiedAuth) {
        this.unifiedAuth = unifiedAuth;
        this.authAttempts = [];
        logger.info('LearningEngine initialized');
    }

    recordAuthResult(result) {
        this.authAttempts.push({
            timestamp: Date.now(),
            method: result.method,
            success: result.success,
            duration: result.duration,
            userAgent: result.userAgent
        });

        this.optimizeBasedOnLearning();
    }

    optimizeBasedOnLearning() {
        if (this.authAttempts.length < 100) {
            // Not enough data to make a decision
            return;
        }

        const methodStats = {};
        for (const attempt of this.authAttempts) {
            if (!methodStats[attempt.method]) {
                methodStats[attempt.method] = {
                    totalDuration: 0,
                    totalAttempts: 0,
                    successRate: 0
                };
            }
            methodStats[attempt.method].totalDuration += attempt.duration;
            methodStats[attempt.method].totalAttempts++;
            if (attempt.success) {
                methodStats[attempt.method].successRate++;
            }
        }

        const avgDurations = {};
        for (const method in methodStats) {
            avgDurations[method] = methodStats[method].totalDuration / methodStats[method].totalAttempts;
        }

        // Sort the auth methods by average duration
        this.unifiedAuth.config.auth.methods.sort((a, b) => {
            const durationA = avgDurations[a] || Infinity;
            const durationB = avgDurations[b] || Infinity;
            return durationA - durationB;
        });

        logger.info('Optimized auth methods based on learning', {
            newOrder: this.unifiedAuth.config.auth.methods
        });

        // Clear the auth attempts to start fresh
        this.authAttempts = [];
    }
}

module.exports = LearningEngine;

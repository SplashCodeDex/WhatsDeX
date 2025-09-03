// Audit middleware for automatic event logging
const { RateLimiterMemory } = require('rate-limiter-flexible');

module.exports = (bot, context) => {
    const { auditLogger, database } = context;

    // Rate limiter to prevent audit log spam
    const rateLimiter = new RateLimiterMemory({
        keyPrefix: 'audit',
        points: 100, // Number of requests
        duration: 60, // Per 60 seconds
    });

    bot.use(async (ctx, next) => {
        const startTime = Date.now();
        const userId = ctx.getId(ctx.sender.jid);
        const isGroup = ctx.isGroup();
        const command = ctx.used?.command || 'unknown';

        // Extract request information
        const auditData = {
            userId,
            command,
            isGroup,
            ipAddress: ctx.ip || 'unknown',
            userAgent: ctx.userAgent || 'WhatsApp',
            sessionId: ctx.sessionId || 'unknown',
            location: ctx.location || 'unknown'
        };

        try {
            // Rate limit audit logging to prevent spam
            await rateLimiter.consume(auditData.userId);

            // Log command usage
            await auditLogger.logEvent({
                eventType: auditLogger.EVENT_TYPES.API_REQUEST,
                actor: userId,
                actorId: userId,
                action: `Command executed: ${command}`,
                resource: 'command',
                resourceId: command,
                details: {
                    command,
                    isGroup,
                    messageType: ctx.msg?.type || 'unknown',
                    messageLength: ctx.msg?.text?.length || 0,
                    hasMedia: !!(ctx.msg?.image || ctx.msg?.video || ctx.msg?.audio),
                    timestamp: new Date().toISOString()
                },
                riskLevel: auditLogger.RISK_LEVELS.LOW,
                ipAddress: auditData.ipAddress,
                userAgent: auditData.userAgent,
                sessionId: auditData.sessionId,
                location: auditData.location
            });

            // Track user activity
            if (userId) {
                try {
                    const user = await database.user.get(userId);
                    if (user) {
                        // Update last activity
                        await database.user.update(userId, {
                            lastActivity: new Date()
                        });

                        // Log user activity if it's been more than an hour
                        const lastActivityLog = user.lastActivityLog || 0;
                        const now = Date.now();
                        if (now - lastActivityLog > 60 * 60 * 1000) { // 1 hour
                            await auditLogger.logEvent({
                                eventType: auditLogger.EVENT_TYPES.USER_UPDATE,
                                actor: userId,
                                actorId: userId,
                                action: 'User activity updated',
                                resource: 'user',
                                resourceId: userId,
                                details: {
                                    lastActivity: new Date().toISOString(),
                                    commandsUsed: (user.commandsUsed || 0) + 1,
                                    level: user.level || 1,
                                    xp: user.xp || 0
                                },
                                riskLevel: auditLogger.RISK_LEVELS.LOW,
                                ipAddress: auditData.ipAddress,
                                userAgent: auditData.userAgent
                            });

                            await database.user.update(userId, {
                                lastActivityLog: now
                            });
                        }
                    }
                } catch (error) {
                    console.error('Error updating user activity:', error);
                }
            }

        } catch (rateLimitError) {
            // Rate limit exceeded, skip audit logging for this request
            console.warn('Audit logging rate limit exceeded for user:', userId);
        }

        try {
            // Continue to next middleware
            await next();

            // Log successful command execution
            const executionTime = Date.now() - startTime;
            await auditLogger.logEvent({
                eventType: auditLogger.EVENT_TYPES.API_REQUEST,
                actor: userId,
                actorId: userId,
                action: `Command completed: ${command}`,
                resource: 'command',
                resourceId: command,
                details: {
                    command,
                    executionTime,
                    success: true,
                    timestamp: new Date().toISOString()
                },
                riskLevel: auditLogger.RISK_LEVELS.LOW,
                ipAddress: auditData.ipAddress,
                userAgent: auditData.userAgent,
                sessionId: auditData.sessionId
            });

        } catch (error) {
            // Log failed command execution
            const executionTime = Date.now() - startTime;
            await auditLogger.logEvent({
                eventType: auditLogger.EVENT_TYPES.API_ERROR,
                actor: userId,
                actorId: userId,
                action: `Command failed: ${command}`,
                resource: 'command',
                resourceId: command,
                details: {
                    command,
                    executionTime,
                    success: false,
                    error: error.message,
                    stack: error.stack,
                    timestamp: new Date().toISOString()
                },
                riskLevel: auditLogger.RISK_LEVELS.MEDIUM,
                ipAddress: auditData.ipAddress,
                userAgent: auditData.userAgent,
                sessionId: auditData.sessionId
            });

            throw error; // Re-throw to maintain error handling flow
        }
    });

    // Log bot events
    bot.on('user_join', async (ctx) => {
        const userId = ctx.getId(ctx.participant);
        await auditLogger.logEvent({
            eventType: auditLogger.EVENT_TYPES.USER_REGISTER,
            actor: userId,
            actorId: userId,
            action: 'User joined group',
            resource: 'group',
            resourceId: ctx.id,
            details: {
                groupId: ctx.id,
                groupName: ctx.group?.name || 'Unknown',
                joinTime: new Date().toISOString()
            },
            riskLevel: auditLogger.RISK_LEVELS.LOW,
            ipAddress: 'unknown',
            userAgent: 'WhatsApp'
        });
    });

    bot.on('user_leave', async (ctx) => {
        const userId = ctx.getId(ctx.participant);
        await auditLogger.logEvent({
            eventType: auditLogger.EVENT_TYPES.USER_UPDATE,
            actor: userId,
            actorId: userId,
            action: 'User left group',
            resource: 'group',
            resourceId: ctx.id,
            details: {
                groupId: ctx.id,
                groupName: ctx.group?.name || 'Unknown',
                leaveTime: new Date().toISOString()
            },
            riskLevel: auditLogger.RISK_LEVELS.LOW,
            ipAddress: 'unknown',
            userAgent: 'WhatsApp'
        });
    });

    // Log payment events
    bot.on('payment_success', async (data) => {
        await auditLogger.logPayment({
            type: 'success',
            userId: data.userId,
            amount: data.amount,
            currency: data.currency,
            method: data.method,
            paymentId: data.paymentId,
            subscriptionId: data.subscriptionId,
            plan: data.plan,
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
            sessionId: data.sessionId
        });
    });

    bot.on('payment_failure', async (data) => {
        await auditLogger.logPayment({
            type: 'failure',
            userId: data.userId,
            amount: data.amount,
            currency: data.currency,
            method: data.method,
            paymentId: data.paymentId,
            failureReason: data.failureReason,
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
            sessionId: data.sessionId
        });
    });

    // Log security events
    bot.on('suspicious_activity', async (data) => {
        await auditLogger.logSecurity({
            type: 'suspicious_activity',
            userId: data.userId,
            reason: data.reason,
            attempts: data.attempts,
            threshold: data.threshold,
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
            sessionId: data.sessionId,
            location: data.location
        });
    });

    bot.on('rate_limit_exceeded', async (data) => {
        await auditLogger.logSecurity({
            type: 'rate_limit',
            userId: data.userId,
            reason: 'Rate limit exceeded',
            attempts: data.attempts,
            threshold: data.threshold,
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
            sessionId: data.sessionId
        });
    });

    // Log system events
    process.on('SIGINT', async () => {
        await auditLogger.logSystem({
            type: 'stop',
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            timestamp: new Date().toISOString()
        });
    });

    process.on('SIGTERM', async () => {
        await auditLogger.logSystem({
            type: 'stop',
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            timestamp: new Date().toISOString()
        });
    });

    process.on('uncaughtException', async (error) => {
        await auditLogger.logSystem({
            type: 'error',
            error: error.message,
            stack: error.stack,
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            timestamp: new Date().toISOString()
        });
    });

    process.on('unhandledRejection', async (reason, promise) => {
        await auditLogger.logSystem({
            type: 'error',
            error: `Unhandled Rejection: ${reason}`,
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            timestamp: new Date().toISOString()
        });
    });
};
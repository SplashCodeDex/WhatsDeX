// Audit middleware for automatic event logging
import { RateLimiterMemory } from 'rate-limiter-flexible';



// Rate limiter instance
const rateLimiter = new RateLimiterMemory({
  keyPrefix: 'audit',
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
});

export default async (ctx, context) => {
  const { auditLogger, database } = context;

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
    location: ctx.location || 'unknown',
  };

  try {
    // Rate limit audit logging to prevent spam
    await rateLimiter.consume(auditData.userId);

    // Log command usage (Request Start)
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
        timestamp: new Date().toISOString(),
      },
      riskLevel: auditLogger.RISK_LEVELS.LOW,
      ipAddress: auditData.ipAddress,
      userAgent: auditData.userAgent,
      sessionId: auditData.sessionId,
      location: auditData.location,
    });

    // Track user activity
    if (userId) {
      try {
        const user = await database.getUser(userId);
        if (user) {
          // Update last activity
          await database.updateUser(userId, {
            lastActivity: new Date(),
          });

          // Log user activity if it's been more than an hour
          const lastActivityLog = user.lastActivityLog || 0;
          const now = Date.now();
          if (now - lastActivityLog > 60 * 60 * 1000) {
            // 1 hour
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
                xp: user.xp || 0,
              },
              riskLevel: auditLogger.RISK_LEVELS.LOW,
              ipAddress: auditData.ipAddress,
              userAgent: auditData.userAgent,
            });

            await database.updateUser(userId, {
              lastActivityLog: now,
            });
          }
        }
      } catch (error) {
        console.error('Error updating user activity:', error);
      }
    }
  } catch (rateLimitError) {
    // Rate limit exceeded, skip audit logging for this request
    // console.warn('Audit logging rate limit exceeded for user:', userId);
  }

  return true;
};

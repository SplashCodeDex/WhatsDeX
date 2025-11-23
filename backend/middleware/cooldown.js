
let redisClient = null;

// Try to import Redis client, but don't fail if Redis is not available
try {
  const redisModule = await import('../lib/redis.js');
  redisClient = redisModule.default;
} catch (error) {
  console.warn('⚠️ Redis not available for cooldown management:', error.message);
}

export default async (ctx, context) => {
    const { config, bot } = context;
    const msg = ctx.msg;
    const senderJid = ctx.sender.jid;

    if (!senderJid) return true; // Cannot determine sender, skip cooldown

    const messageContent =
      msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
    const command = messageContent.split(' ')[0]?.toLowerCase(); // Simple command extraction

    if (!command) return true; // No command found, skip cooldown

    // Skip cooldown for owner
    const isOwner = context.tools.cmd.isOwner(config, ctx.getId(senderJid), msg.key.id);
    if (isOwner) return true;

    if (!redisClient) return true;

    const cooldownKey = `cooldown:${senderJid}:${command}`;
    const lastUsed = await redisClient.get(cooldownKey);
    const now = Date.now();
    const cooldownDuration = config.bot.cooldownMs || 10000; // Default 10s

    if (lastUsed) {
      const lastUsedTimestamp = parseInt(lastUsed, 10);
      if (now - lastUsedTimestamp < cooldownDuration) {
        const remainingTime = Math.ceil((cooldownDuration - (now - lastUsedTimestamp)) / 1000);
        await bot.sendMessage(senderJid, {
          text: `Please wait ${remainingTime} seconds before using the '${command}' command again.`,
        });
        return false; // Stop processing
      }
    }

    // Update cooldown for the command in Redis
    await redisClient.setex(cooldownKey, Math.ceil(cooldownDuration / 1000), now.toString());

    return true; // Continue processing
};

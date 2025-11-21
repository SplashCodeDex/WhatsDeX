import config from '../config.js';

let redisClient = null;

// Try to import Redis client, but don't fail if Redis is not available
try {
  const redisModule = await import('../lib/redis.js');
  redisClient = redisModule.default;
} catch (error) {
  console.warn('⚠️ Redis not available for cooldown management:', error.message);
}

class Cooldown {
  constructor() {
    // Cooldown period will be fetched from config.system.cooldown
  }

  getSenderJid(msg) {
    if (!msg.key.remoteJid) return null;
    return msg.key.fromMe ? msg.key.remoteJid : msg.participant || msg.key.remoteJid;
  }

  async checkAndApplyCooldown(sock, msg) {
    const senderJid = this.getSenderJid(msg);
    if (!senderJid) return false; // Cannot determine sender, skip cooldown

    const messageContent =
      msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
    const command = messageContent.split(' ')[0]?.toLowerCase(); // Simple command extraction

    if (!command) return false; // No command found, skip cooldown

    const cooldownKey = `cooldown:${senderJid}:${command}`;
    const lastUsed = await redisClient.get(cooldownKey);
    const now = Date.now();
    const cooldownDuration = config.system.cooldown; // Cooldown duration in milliseconds

    if (lastUsed) {
      const lastUsedTimestamp = parseInt(lastUsed, 10);
      if (now - lastUsedTimestamp < cooldownDuration) {
        const remainingTime = Math.ceil((cooldownDuration - (now - lastUsedTimestamp)) / 1000);
        await sock.sendMessage(senderJid, {
          text: `Please wait ${remainingTime} seconds before using the '${command}' command again.`,
        });
        return true; // Indicate that the message was handled (cooldown triggered)
      }
    }

    // Update cooldown for the command in Redis
    await redisClient.setex(cooldownKey, cooldownDuration / 1000, now.toString()); // SETEX expects seconds

    return false; // Indicate that the message should proceed to other handlers
  }
}

export { Cooldown };

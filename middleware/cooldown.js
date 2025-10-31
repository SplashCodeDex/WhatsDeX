const COOLDOWN_SECONDS = 10; // Cooldown period in seconds
const cooldowns = new Map(); // Map<userId, Map<command, timestamp>>

class Cooldown {
  constructor() {
    this.COOLDOWN_SECONDS = COOLDOWN_SECONDS;
    this.cooldowns = cooldowns;
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

    // Initialize user's cooldown map if it doesn't exist
    if (!this.cooldowns.has(senderJid)) {
      this.cooldowns.set(senderJid, new Map());
    }

    const userCooldowns = this.cooldowns.get(senderJid);
    const lastUsed = userCooldowns.get(command);
    const now = Date.now();

    if (lastUsed && now - lastUsed < this.COOLDOWN_SECONDS * 1000) {
      const remainingTime = Math.ceil((this.COOLDOWN_SECONDS * 1000 - (now - lastUsed)) / 1000);
      await sock.sendMessage(senderJid, {
        text: `Please wait ${remainingTime} seconds before using the '${command}' command again.`,
      });
      return true; // Indicate that the message was handled (cooldown triggered)
    }

    // Update cooldown for the command
    userCooldowns.set(command, now);
    return false; // Indicate that the message should proceed to other handlers
  }
}

module.exports = { Cooldown };

/**
 * Cooldown Middleware for WhatsDeX
 * Implements rate limiting and cooldown functionality for commands
 */

class Cooldown {
  constructor() {
    this.cooldowns = new Map();
  }

  /**
   * Check if a user is on cooldown for a specific command
   * @param {string} userId - User identifier
   * @param {string} command - Command name
   * @param {number} cooldownMs - Cooldown duration in milliseconds
   * @returns {boolean} - True if user is on cooldown, false otherwise
   */
  isOnCooldown(userId, command, cooldownMs) {
    const key = `${userId}:${command}`;
    const lastUsed = this.cooldowns.get(key);

    if (!lastUsed) {
      return false;
    }

    const timePassed = Date.now() - lastUsed;
    return timePassed < cooldownMs;
  }

  /**
   * Set cooldown for a user and command
   * @param {string} userId - User identifier
   * @param {string} command - Command name
   */
  setCooldown(userId, command) {
    const key = `${userId}:${command}`;
    this.cooldowns.set(key, Date.now());
  }

  /**
   * Get remaining cooldown time for a user and command
   * @param {string} userId - User identifier
   * @param {string} command - Command name
   * @param {number} cooldownMs - Cooldown duration in milliseconds
   * @returns {number} - Remaining time in milliseconds, 0 if not on cooldown
   */
  getRemainingTime(userId, command, cooldownMs) {
    const key = `${userId}:${command}`;
    const lastUsed = this.cooldowns.get(key);

    if (!lastUsed) {
      return 0;
    }

    const timePassed = Date.now() - lastUsed;
    const remaining = cooldownMs - timePassed;

    return Math.max(0, remaining);
  }

  /**
   * Clear cooldown for a user and command
   * @param {string} userId - User identifier
   * @param {string} command - Command name
   */
  clearCooldown(userId, command) {
    const key = `${userId}:${command}`;
    this.cooldowns.delete(key);
  }

  /**
   * Clear all cooldowns for a user
   * @param {string} userId - User identifier
   */
  clearUserCooldowns(userId) {
    for (const [key] of this.cooldowns) {
      if (key.startsWith(`${userId}:`)) {
        this.cooldowns.delete(key);
      }
    }
  }

  /**
   * Clean up expired cooldowns
   * @param {number} maxAge - Maximum age in milliseconds for cleanup
   */
  cleanup(maxAge = 3600000) { // Default 1 hour
    const now = Date.now();
    for (const [key, timestamp] of this.cooldowns) {
      if (now - timestamp > maxAge) {
        this.cooldowns.delete(key);
      }
    }
  }

  /**
   * Get cooldown statistics
   * @returns {object} - Statistics about current cooldowns
   */
  getStats() {
    return {
      totalCooldowns: this.cooldowns.size,
      uniqueUsers: new Set([...this.cooldowns.keys()].map(key => key.split(':')[0])).size,
      uniqueCommands: new Set([...this.cooldowns.keys()].map(key => key.split(':')[1])).size
    };
  }
}

module.exports = { Cooldown };
/**
 * Cooldown Middleware for WhatsDeX
 * Implements rate limiting and cooldown functionality for commands
 */

class Cooldown {
  private cooldowns: Map<string, number>;

  constructor() {
    this.cooldowns = new Map<string, number>();
  }

  /**
   * Check if a user is on cooldown for a specific command
   * @param userId - User identifier
   * @param command - Command name
   * @param cooldownMs - Cooldown duration in milliseconds
   * @returns - True if user is on cooldown, false otherwise
   */
  isOnCooldown(userId: string, command: string, cooldownMs: number): boolean {
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
   * @param userId - User identifier
   * @param command - Command name
   */
  setCooldown(userId: string, command: string): void {
    const key = `${userId}:${command}`;
    this.cooldowns.set(key, Date.now());
  }

  /**
   * Get remaining cooldown time for a user and command
   * @param userId - User identifier
   * @param command - Command name
   * @param cooldownMs - Cooldown duration in milliseconds
   * @returns - Remaining time in milliseconds, 0 if not on cooldown
   */
  getRemainingTime(userId: string, command: string, cooldownMs: number): number {
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
   * @param userId - User identifier
   * @param command - Command name
   */
  clearCooldown(userId: string, command: string): void {
    const key = `${userId}:${command}`;
    this.cooldowns.delete(key);
  }

  /**
   * Clear all cooldowns for a user
   * @param userId - User identifier
   */
  clearUserCooldowns(userId: string): void {
    for (const key of this.cooldowns.keys()) {
      if (key.startsWith(`${userId}:`)) {
        this.cooldowns.delete(key);
      }
    }
  }

  /**
   * Clean up expired cooldowns
   * @param maxAge - Maximum age in milliseconds for cleanup
   */
  cleanup(maxAge: number = 3600000): void {
    // Default 1 hour
    const now = Date.now();
    for (const [key, timestamp] of this.cooldowns.entries()) {
      if (now - timestamp > maxAge) {
        this.cooldowns.delete(key);
      }
    }
  }

  /**
   * Get cooldown statistics
   * @returns - Statistics about current cooldowns
   */
  getStats(): { totalCooldowns: number; uniqueUsers: number; uniqueCommands: number } {
    const keys = Array.from(this.cooldowns.keys());
    return {
      totalCooldowns: this.cooldowns.size,
      uniqueUsers: new Set(keys.map(key => key.split(':')[0])).size,
      uniqueCommands: new Set(keys.map(key => key.split(':')[1])).size,
    };
  }
}

export { Cooldown };

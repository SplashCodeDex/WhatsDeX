/**
 * Menfes/Confess Service - Anonymous messaging system
 * Implements private messaging between users with proper privacy and rate limiting
 */

import crypto from 'crypto';

class MenfesService {
  constructor() {
    this.activeSessions = new Map();
    this.sessionTimeouts = new Map();
    this.rateLimits = new Map();
    this.messageHistory = new Map();
  }

  /**
   * Start menfes session between two users
   * @param {string} fromUser - Sender user ID
   * @param {string} toUser - Target user ID (phone number)
   * @param {string} fakeName - Anonymous name to use
   */
  async startMenfesSession(fromUser, toUser, fakeName) {
    try {
      // Validate phone number format
      const cleanNumber = toUser.replace(/\D/g, '');
      if (cleanNumber.length < 10 || cleanNumber.length > 15) {
        throw new Error('Invalid phone number format');
      }

      const targetJid = `${cleanNumber}@s.whatsapp.net`;

      // Check if session already exists
      if (this.activeSessions.has(fromUser)) {
        throw new Error(`Kamu Sedang Berada Di Sesi menfes!`);
      }

      if (this.activeSessions.has(targetJid)) {
        throw new Error('Target user sudah dalam sesi menfes dengan orang lain');
      }

      // Check rate limits
      if (!this.checkRateLimit(fromUser, 'start_session')) {
        throw new Error('Rate limit exceeded. Please wait before starting new session');
      }

      const sessionId = crypto.randomUUID();

      const sessionData = {
        id: sessionId,
        fromUser,
        toUser: targetJid,
        fakeName: fakeName || 'Seseorang',
        startTime: Date.now(),
        messageCount: 0,
        isActive: true,
      };

      // Create bidirectional sessions
      this.activeSessions.set(fromUser, sessionData);
      this.activeSessions.set(targetJid, {
        ...sessionData,
        fromUser: targetJid,
        toUser: fromUser,
        fakeName: 'Penerima',
      });

      // Set session timeout (10 minutes)
      const timeout = setTimeout(() => {
        this.endMenfesSession(fromUser, 'timeout');
      }, 600000);

      this.sessionTimeouts.set(fromUser, timeout);
      this.sessionTimeouts.set(targetJid, timeout);

      // Initialize message history
      this.messageHistory.set(sessionId, []);

      return {
        success: true,
        sessionId,
        message: `_Memulai menfes..._\n*Silahkan Mulai kirim pesan/media*\n*Durasi menfes hanya selama 10 menit*\n*Note :* jika ingin mengakhiri ketik _*delmenfes*_`,
      };
    } catch (error) {
      console.error('Error starting menfes session:', error);
      throw error;
    }
  }

  /**
   * Send menfes message
   * @param {string} fromUser - Sender user ID
   * @param {Object} message - Message object
   */
  async sendMenfesMessage(fromUser, message) {
    try {
      const session = this.activeSessions.get(fromUser);
      if (!session || !session.isActive) {
        throw new Error('No active menfes session found');
      }

      // Check if session is still valid
      if (Date.now() - session.startTime > 600000) {
        await this.endMenfesSession(fromUser, 'expired');
        throw new Error('Session expired');
      }

      // Check rate limits for messages
      if (!this.checkRateLimit(fromUser, 'send_message')) {
        throw new Error('Rate limit exceeded. Please slow down');
      }

      // Prepare message for forwarding
      const menfesMessage = {
        ...message,
        contextInfo: {
          isForwarded: true,
          forwardingScore: 1,
          quotedMessage: {
            conversation: `*Pesan Dari ${session.fakeName}*`,
          },
          key: {
            remoteJid: '0@s.whatsapp.net',
            fromMe: false,
            participant: '0@s.whatsapp.net',
          },
        },
      };

      // Store message in history
      const messageHistory = this.messageHistory.get(session.id);
      messageHistory.push({
        from: fromUser,
        to: session.toUser,
        message: menfesMessage,
        timestamp: Date.now(),
      });

      // Update message count
      session.messageCount++;

      return {
        success: true,
        message: 'Pesan berhasil dikirim melalui menfes',
        forwarded: true,
      };
    } catch (error) {
      console.error('Error sending menfes message:', error);
      throw error;
    }
  }

  /**
   * End menfes session
   * @param {string} userId - User ID
   * @param {string} reason - Reason for ending
   */
  async endMenfesSession(userId, reason = 'manual') {
    try {
      const session = this.activeSessions.get(userId);
      if (!session) {
        return { success: false, message: 'No active session found' };
      }

      // Clear timeouts
      const timeout = this.sessionTimeouts.get(userId);
      if (timeout) {
        clearTimeout(timeout);
        this.sessionTimeouts.delete(userId);
      }

      const otherUser = session.fromUser === userId ? session.toUser : session.fromUser;

      const otherTimeout = this.sessionTimeouts.get(otherUser);
      if (otherTimeout) {
        clearTimeout(otherTimeout);
        this.sessionTimeouts.delete(otherUser);
      }

      // Remove sessions
      this.activeSessions.delete(userId);
      this.activeSessions.delete(otherUser);

      // Archive message history
      const history = this.messageHistory.get(session.id);
      if (history) {
        // Keep history for 24 hours for moderation purposes
        setTimeout(
          () => {
            this.messageHistory.delete(session.id);
          },
          24 * 60 * 60 * 1000
        );
      }

      return {
        success: true,
        message: `Sukses Mengakhiri Sesi menfes!\nAlasan: ${reason}`,
        sessionId: session.id,
        messageCount: session.messageCount,
      };
    } catch (error) {
      console.error('Error ending menfes session:', error);
      throw new Error('Failed to end menfes session');
    }
  }

  /**
   * Get active session for user
   * @param {string} userId - User ID
   */
  getActiveSession(userId) {
    return this.activeSessions.get(userId);
  }

  /**
   * Get session statistics
   * @param {string} sessionId - Session ID
   */
  getSessionStats(sessionId) {
    const history = this.messageHistory.get(sessionId);
    if (!history) {
      return null;
    }

    return {
      messageCount: history.length,
      duration:
        history.length > 0 ? history[history.length - 1].timestamp - history[0].timestamp : 0,
      participants: [...new Set(history.map(h => h.from))],
    };
  }

  /**
   * Check rate limit for operations
   * @param {string} userId - User ID
   * @param {string} operation - Operation type
   */
  checkRateLimit(userId, operation) {
    const key = `${userId}_${operation}`;
    const now = Date.now();
    const limit = this.rateLimits.get(key);

    const limits = {
      start_session: { cooldown: 300000, maxPerCooldown: 1 }, // 5 minutes, 1 session
      send_message: { cooldown: 10000, maxPerCooldown: 5 }, // 10 seconds, 5 messages
    };

    const config = limits[operation] || { cooldown: 60000, maxPerCooldown: 1 };

    if (!limit || now - limit.lastUsed > config.cooldown) {
      this.rateLimits.set(key, { lastUsed: now, count: 1 });
      return true;
    }

    if (limit.count >= config.maxPerCooldown) {
      return false;
    }

    limit.count++;
    return true;
  }

  /**
   * Clean up expired sessions and old data
   */
  cleanup() {
    const now = Date.now();

    // Clean up expired sessions
    for (const [userId, session] of this.activeSessions.entries()) {
      if (now - session.startTime > 600000) {
        // 10 minutes
        this.endMenfesSession(userId, 'expired');
      }
    }

    // Clean up old message history (older than 24 hours)
    for (const [sessionId, history] of this.messageHistory.entries()) {
      if (history.length > 0 && now - history[0].timestamp > 24 * 60 * 60 * 1000) {
        this.messageHistory.delete(sessionId);
      }
    }

    // Clean up old rate limits (older than 1 hour)
    for (const [key, limit] of this.rateLimits.entries()) {
      if (now - limit.lastUsed > 60 * 60 * 1000) {
        this.rateLimits.delete(key);
      }
    }
  }

  /**
   * Get active sessions count (for monitoring)
   */
  getActiveSessionsCount() {
    return this.activeSessions.size / 2; // Divide by 2 since each session has 2 entries
  }

  /**
   * Moderate message content (basic filtering)
   * @param {string} content - Message content
   */
  moderateContent(content) {
    if (!content) return true;

    // Basic content filtering
    const forbiddenWords = [
      'spam',
      'scam',
      'hack',
      'illegal',
      'drugs',
      'violence',
      'threat',
      'harassment',
    ];

    const lowerContent = content.toLowerCase();
    return !forbiddenWords.some(word => lowerContent.includes(word));
  }
}

// Create and export service instance as ES module
const menfesServiceInstance = new MenfesService();
export default menfesServiceInstance;

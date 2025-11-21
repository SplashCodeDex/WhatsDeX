const crypto = require('crypto');
const logger = require('../utils/logger');

class SecurityMiddleware {
  constructor() {
    this.suspiciousPatterns = [
      /\b(unban|hack|exploit|cheat|crack)\b/i,
      /\b(sql|script|injection|attack)\b/i,
      /\b(password|token|key|secret)\b.*\b(leak|steal|dump)\b/i,
      /\b(ddos|spam|botnet)\b/i,
      /\b(malware|virus|ransomware)\b/i,
    ];

    this.rateLimitCache = new Map();
    this.blockedIPs = new Set();
    this.suspiciousUsers = new Set();
  }

  /**
   * Main security middleware function
   * @param {Object} context - Message context
   * @returns {Object} Security check result
   */
  async checkSecurity(context) {
    const { message, userId, userJid, remoteJid } = context;

    try {
      // Extract IP-like information (for logging)
      const clientInfo = this.extractClientInfo(context);

      // 1. Content analysis
      const contentCheck = this.analyzeContent(message);
      if (contentCheck.blocked) {
        await this.logSecurityEvent('content_blocked', {
          userId,
          userJid,
          remoteJid,
          reason: contentCheck.reason,
          content: message.substring(0, 100),
          clientInfo,
        });
        return { allowed: false, reason: contentCheck.reason };
      }

      // 2. Rate limiting check
      const rateCheck = this.checkRateLimit(userId, remoteJid);
      if (!rateCheck.allowed) {
        await this.logSecurityEvent('rate_limit_exceeded', {
          userId,
          userJid,
          remoteJid,
          reason: rateCheck.reason,
          clientInfo,
        });
        return { allowed: false, reason: rateCheck.reason };
      }

      // 3. Spam detection
      const spamCheck = this.detectSpam(message, userId);
      if (spamCheck.blocked) {
        await this.logSecurityEvent('spam_detected', {
          userId,
          userJid,
          remoteJid,
          reason: spamCheck.reason,
          clientInfo,
        });
        return { allowed: false, reason: spamCheck.reason };
      }

      // 4. Check for blocked users/IPs
      if (this.isBlocked(userId, clientInfo.ip)) {
        await this.logSecurityEvent('blocked_user', {
          userId,
          userJid,
          remoteJid,
          reason: 'User is blocked',
          clientInfo,
        });
        return { allowed: false, reason: 'Access denied' };
      }

      // 5. Command injection detection
      const injectionCheck = this.detectCommandInjection(message);
      if (injectionCheck.blocked) {
        await this.logSecurityEvent('command_injection', {
          userId,
          userJid,
          remoteJid,
          reason: injectionCheck.reason,
          content: message,
          clientInfo,
        });
        return { allowed: false, reason: injectionCheck.reason };
      }

      return { allowed: true };
    } catch (error) {
      logger.error('Security middleware error:', error);
      // Fail-safe: allow request but log the error
      await this.logSecurityEvent('middleware_error', {
        userId,
        userJid,
        remoteJid,
        error: error.message,
      });
      return { allowed: true };
    }
  }

  /**
   * Analyze message content for security threats
   * @param {string} content - Message content
   * @returns {Object} Analysis result
   */
  analyzeContent(content) {
    if (!content || typeof content !== 'string') {
      return { blocked: false };
    }

    // Check for suspicious patterns
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(content)) {
        return {
          blocked: true,
          reason: 'Message contains suspicious content',
        };
      }
    }

    // Check for excessive caps
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.7 && content.length > 10) {
      return {
        blocked: true,
        reason: 'Message contains excessive capital letters (possible spam)',
      };
    }

    // Check for repetitive characters
    if (/(.)\1{10,}/.test(content)) {
      return {
        blocked: true,
        reason: 'Message contains repetitive characters',
      };
    }

    // Check for suspicious URLs
    const urlRegex = /https?:\/\/[^\s]+/g;
    const urls = content.match(urlRegex);
    if (urls) {
      for (const url of urls) {
        if (this.isSuspiciousUrl(url)) {
          return {
            blocked: true,
            reason: 'Message contains suspicious URL',
          };
        }
      }
    }

    return { blocked: false };
  }

  /**
   * Check rate limiting
   * @param {string} userId - User ID
   * @param {string} remoteJid - Remote JID
   * @returns {Object} Rate limit check result
   */
  checkRateLimit(userId, remoteJid) {
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxRequests = 30; // 30 requests per minute

    const key = `${userId}:${remoteJid}`;
    const userRequests = this.rateLimitCache.get(key) || [];

    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => now - time < windowMs);

    if (validRequests.length >= maxRequests) {
      return {
        allowed: false,
        reason: `Rate limit exceeded: ${maxRequests} requests per minute`,
      };
    }

    // Add current request
    validRequests.push(now);
    this.rateLimitCache.set(key, validRequests);

    // Cleanup old entries periodically
    if (Math.random() < 0.01) {
      // 1% chance
      this.cleanupRateLimitCache();
    }

    return { allowed: true };
  }

  /**
   * Detect spam patterns
   * @param {string} content - Message content
   * @param {string} userId - User ID
   * @returns {Object} Spam detection result
   */
  detectSpam(content, userId) {
    if (!content) return { blocked: false };

    // Track user message patterns
    const userKey = `spam:${userId}`;
    const userMessages = this.rateLimitCache.get(userKey) || [];

    // Check for identical messages (possible spam bot)
    if (userMessages.includes(content)) {
      return {
        blocked: true,
        reason: 'Duplicate message detected (possible spam)',
      };
    }

    // Keep track of recent messages
    userMessages.push(content);
    if (userMessages.length > 10) {
      userMessages.shift(); // Keep only last 10 messages
    }
    this.rateLimitCache.set(userKey, userMessages);

    // Check for message flooding
    const recentMessages = userMessages.filter(
      msg => Date.now() - (this.rateLimitCache.get(`${userKey}:time:${msg}`) || 0) < 10000 // 10 seconds
    );

    if (recentMessages.length > 5) {
      return {
        blocked: true,
        reason: 'Message flooding detected',
      };
    }

    return { blocked: false };
  }

  /**
   * Detect command injection attempts
   * @param {string} content - Message content
   * @returns {Object} Injection detection result
   */
  detectCommandInjection(content) {
    if (!content) return { blocked: false };

    // Common command injection patterns
    const injectionPatterns = [
      /[;&|`$()]/, // Shell metacharacters
      /\b(eval|exec|system|shell_exec|passthru)\b/i, // PHP functions
      /\b(process|child_process|spawn|exec)\b.*\b(require|import)\b/i, // Node.js patterns
      /<\?php/i, // PHP code
      /<script/i, // Script tags
      /javascript:/i, // JavaScript URLs
      /data:text\/html/i, // Data URLs
    ];

    for (const pattern of injectionPatterns) {
      if (pattern.test(content)) {
        return {
          blocked: true,
          reason: 'Potential command injection detected',
        };
      }
    }

    return { blocked: false };
  }

  /**
   * Check if user/IP is blocked
   * @param {string} userId - User ID
   * @param {string} ip - IP address
   * @returns {boolean} Whether blocked
   */
  isBlocked(userId, ip) {
    return this.blockedIPs.has(ip) || this.suspiciousUsers.has(userId);
  }

  /**
   * Check if URL is suspicious
   * @param {string} url - URL to check
   * @returns {boolean} Whether suspicious
   */
  isSuspiciousUrl(url) {
    const suspiciousDomains = [
      'bit.ly',
      'tinyurl.com',
      'goo.gl', // URL shorteners
      'pastebin.com',
      'hastebin.com', // Paste sites
      /\.onion/, // Tor hidden services
      /[\w-]+\.ru$/, // Russian domains (often malicious)
      /[\w-]+\.cn$/, // Chinese domains (often malicious)
    ];

    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.toLowerCase();

      return suspiciousDomains.some(pattern => {
        if (typeof pattern === 'string') {
          return domain.includes(pattern);
        }
        return pattern.test(domain);
      });
    } catch (error) {
      // Invalid URL
      return true;
    }
  }

  /**
   * Extract client information for logging
   * @param {Object} context - Message context
   * @returns {Object} Client information
   */
  extractClientInfo(context) {
    return {
      userAgent: context.userAgent || 'unknown',
      platform: context.platform || 'unknown',
      ip: this.hashIdentifier(context.remoteJid || 'unknown'), // Hash for privacy
      sessionId: context.sessionId || 'unknown',
    };
  }

  /**
   * Hash identifier for privacy-preserving logging
   * @param {string} identifier - Identifier to hash
   * @returns {string} Hashed identifier
   */
  hashIdentifier(identifier) {
    return crypto.createHash('sha256').update(identifier).digest('hex').substring(0, 16);
  }

  /**
   * Log security event
   * @param {string} eventType - Event type
   * @param {Object} details - Event details
   */
  async logSecurityEvent(eventType, details) {
    try {
      const auditLogger = require('../services/auditLogger');
      await auditLogger.logEvent({
        eventType,
        actor: details.userId || 'unknown',
        actorId: details.userId,
        action: eventType,
        resource: 'security',
        details: {
          reason: details.reason,
          content: details.content,
          clientInfo: details.clientInfo,
        },
        riskLevel: this.getRiskLevel(eventType),
        ipAddress: details.clientInfo?.ip,
        userAgent: details.clientInfo?.userAgent,
        sessionId: details.clientInfo?.sessionId,
      });
    } catch (error) {
      logger.error('Failed to log security event:', error);
    }
  }

  /**
   * Get risk level for event type
   * @param {string} eventType - Event type
   * @returns {string} Risk level
   */
  getRiskLevel(eventType) {
    const riskLevels = {
      content_blocked: 'medium',
      rate_limit_exceeded: 'low',
      spam_detected: 'medium',
      blocked_user: 'high',
      command_injection: 'critical',
      middleware_error: 'medium',
    };

    return riskLevels[eventType] || 'low';
  }

  /**
   * Add IP to blocked list
   * @param {string} ip - IP address to block
   * @param {number} duration - Block duration in milliseconds
   */
  blockIP(ip, duration = 3600000) {
    // Default 1 hour
    this.blockedIPs.add(ip);
    setTimeout(() => {
      this.blockedIPs.delete(ip);
    }, duration);
  }

  /**
   * Add user to suspicious list
   * @param {string} userId - User ID to mark as suspicious
   * @param {number} duration - Duration in milliseconds
   */
  markUserSuspicious(userId, duration = 3600000) {
    this.suspiciousUsers.add(userId);
    setTimeout(() => {
      this.suspiciousUsers.delete(userId);
    }, duration);
  }

  /**
   * Cleanup rate limit cache
   */
  cleanupRateLimitCache() {
    const now = Date.now();
    const maxAge = 600000; // 10 minutes

    for (const [key, timestamps] of this.rateLimitCache.entries()) {
      const validTimestamps = timestamps.filter(time => now - time < maxAge);
      if (validTimestamps.length === 0) {
        this.rateLimitCache.delete(key);
      } else {
        this.rateLimitCache.set(key, validTimestamps);
      }
    }
  }

  /**
   * Get security statistics
   * @returns {Object} Security statistics
   */
  getStats() {
    return {
      blockedIPs: this.blockedIPs.size,
      suspiciousUsers: this.suspiciousUsers.size,
      rateLimitCacheSize: this.rateLimitCache.size,
      suspiciousPatterns: this.suspiciousPatterns.length,
    };
  }
}

module.exports = SecurityMiddleware;

/**
 * Persistent Rate Limiter using Redis
 * Fixes primitive rate limiting that resets on restart
 */

export class RateLimiter {
  constructor(redisClient, options = {}) {
    if (!redisClient) {
      throw new Error('RateLimiter requires a valid redisClient instance.');
    }
    this.redis = redisClient;

    // Default rate limit configurations from options or fallback
    this.defaultLimits = options.limits || {
      global: { requests: 100, window: 60 },
      user: { requests: 30, window: 60 },
      command: { requests: 10, window: 60 },
      ai: { requests: 5, window: 300 },
      download: { requests: 3, window: 60 },
      premium: { requests: 100, window: 60 }
    };
  }

  async isAllowed(key, type = 'user', customLimit = null) {
    try {
      const limit = customLimit || this.defaultLimits[type];
      if (!limit) {
        throw new Error(`Unknown rate limit type: ${type}`);
      }

      const redisKey = `ratelimit:${type}:${key}`;
      const multi = this.redis.multi();
      
      multi.incr(redisKey);
      multi.expire(redisKey, limit.window);
      
      const results = await multi.exec();
      const currentCount = results[0][1];
      
      if (currentCount > limit.requests) {
        const ttl = await this.redis.ttl(redisKey);
        return {
          allowed: false,
          current: currentCount,
          limit: limit.requests,
          remaining: 0,
          resetTime: ttl > 0 ? Date.now() + (ttl * 1000) : null
        };
      }

      return {
        allowed: true,
        current: currentCount,
        limit: limit.requests,
        remaining: limit.requests - currentCount,
        resetTime: Date.now() + (limit.window * 1000)
      };

    } catch (error) {
      console.error('Rate limiting error:', error);
      // Fail open - allow request if rate limiter is down
      return {
        allowed: true,
        current: 0,
        limit: 1000,
        remaining: 999,
        error: error.message
      };
    }
  }

  async checkMultiple(checks) {
    const results = [];
    
    for (const check of checks) {
      const result = await this.isAllowed(check.key, check.type, check.limit);
      results.push({ ...check, result });
      
      if (!result.allowed) {
        return { allowed: false, failedCheck: check, results };
      }
    }
    
    return { allowed: true, results };
  }

  // Refactored to accept userTier directly, removing the need for the placeholder getUserTier
  async checkCommandRateLimit(userId, command, userTier = 'user') {
    const checks = [
      { key: 'global', type: 'global' },
      { key: userId, type: userTier }, // Use the passed userTier
      { key: `${userId}:${command}`, type: 'command' }
    ];

    // Special limits for resource-intensive commands
    if (['gemini', 'dalle', 'gpt'].includes(command)) {
      checks.push({ key: `${userId}:ai`, type: 'ai' });
    }

    if (['youtubedl', 'tiktokedl', 'instagramdl'].includes(command)) {
      checks.push({ key: `${userId}:download`, type: 'download' });
    }

    return this.checkMultiple(checks);
  }

  // Sliding window rate limiter for more precise control
  async slidingWindowCheck(key, limit, windowMs) {
    try {
      const now = Date.now();
      const windowStart = now - windowMs;
      
      const redisKey = `sliding:${key}`;
      const multi = this.redis.multi();
      
      // Remove old entries
      multi.zremrangebyscore(redisKey, '-inf', windowStart);
      
      // Count current requests
      multi.zcard(redisKey);
      
      // Add current request
      multi.zadd(redisKey, now, `${now}-${Math.random()}`);
      
      // Set expiry
      multi.expire(redisKey, Math.ceil(windowMs / 1000));
      
      const results = await multi.exec();
      const currentCount = results[1][1];
      
      if (currentCount >= limit) {
        return {
          allowed: false,
          current: currentCount + 1,
          limit,
          remaining: 0
        };
      }
      
      return {
        allowed: true,
        current: currentCount + 1,
        limit,
        remaining: limit - currentCount - 1
      };
      
    } catch (error) {
      console.error('Sliding window rate limit error:', error);
      return { allowed: true, error: error.message };
    }
  }

  // Get rate limit status for user
  async getStatus(userId, userTier = 'user') {
    try {
      const keys = [
        `ratelimit:${userTier}:${userId}`,
        `ratelimit:command:${userId}`,
        `ratelimit:ai:${userId}:ai`,
        `ratelimit:download:${userId}:download`
      ];
      
      const pipeline = this.redis.pipeline();
      keys.forEach(key => {
        pipeline.get(key);
        pipeline.ttl(key);
      });
      
      const results = await pipeline.exec();
      const status = {};
      
      for (let i = 0; i < keys.length; i += 2) {
        const keyName = keys[i / 2].split(':').pop();
        const count = results[i][1] || 0;
        const ttl = results[i + 1][1] || 0;
        
        status[keyName] = {
          current: parseInt(count),
          resetIn: ttl > 0 ? ttl : 0
        };
      }
      
      return { tier: userTier, limits: status };
      
    } catch (error) {
      console.error('Error getting rate limit status:', error);
      return { error: error.message };
    }
  }

  async resetUserLimits(userId) {
    try {
      const pattern = `ratelimit:*:${userId}*`;
      const keys = await this.redis.keys(pattern);
      
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      
      return { reset: keys.length };
    } catch (error) {
      console.error('Error resetting rate limits:', error);
      return { error: error.message };
    }
  }

  async disconnect() {
    await this.redis.quit();
  }
}

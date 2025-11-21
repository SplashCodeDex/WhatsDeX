/**
 * Memory Manager with TTL and Size Limits
 * Prevents unbounded growth and memory leaks
 */

export class MemoryManager {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 1000;
    this.ttl = options.ttl || 3600000; // 1 hour default
    this.cleanupInterval = options.cleanupInterval || 300000; // 5 minutes
    this.data = new Map();
    this.accessTimes = new Map();
    
    // Start cleanup timer
    this.startCleanupTimer();
  }

  set(key, value, customTTL = null) {
    // Check if we need to evict items
    if (this.data.size >= this.maxSize) {
      this.evictLRU();
    }

    const ttl = customTTL || this.ttl;
    const expiresAt = Date.now() + ttl;
    
    this.data.set(key, { value, expiresAt });
    this.accessTimes.set(key, Date.now());
  }

  get(key) {
    const item = this.data.get(key);
    
    if (!item) return null;

    // Check if expired
    if (Date.now() > item.expiresAt) {
      this.delete(key);
      return null;
    }

    // Update access time for LRU
    this.accessTimes.set(key, Date.now());
    return item.value;
  }

  delete(key) {
    this.data.delete(key);
    this.accessTimes.delete(key);
  }

  has(key) {
    const item = this.data.get(key);
    if (!item) return false;
    
    if (Date.now() > item.expiresAt) {
      this.delete(key);
      return false;
    }
    
    return true;
  }

  // Evict least recently used item
  evictLRU() {
    let oldestKey = null;
    let oldestTime = Date.now();

    for (const [key, accessTime] of this.accessTimes) {
      if (accessTime < oldestTime) {
        oldestTime = accessTime;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  // Clean up expired items
  cleanup() {
    const now = Date.now();
    const expiredKeys = [];

    for (const [key, item] of this.data) {
      if (now > item.expiresAt) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.delete(key));
    
    console.log(`Cleaned up ${expiredKeys.length} expired items`);
  }

  startCleanupTimer() {
    const timer = setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
    timer.unref(); // Allow the process to exit even if the timer is active
  }

  // Get stats
  getStats() {
    return {
      size: this.data.size,
      maxSize: this.maxSize,
      memoryUsage: this.data.size / this.maxSize * 100
    };
  }

  clear() {
    this.data.clear();
    this.accessTimes.clear();
  }
}
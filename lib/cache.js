import redisClient from './redis.js';
import crypto from 'crypto';

const DEFAULT_EXPIRATION = 3600; // 1 hour in seconds

/**
 * Retrieves a value from the cache.
 * @param {string} key - The key to retrieve.
 * @returns {Promise<any | null>} The cached value, or null if not found.
 */
async function get(key) {
  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('❌ Redis GET error:', error);
    return null;
  }
}

/**
 * Stores a value in the cache.
 * @param {string} key - The key to store the value under.
 * @param {any} value - The value to store. Must be JSON-serializable.
 * @param {number} [expirationInSeconds=DEFAULT_EXPIRATION] - The cache expiration time in seconds.
 */
async function set(key, value, expirationInSeconds = DEFAULT_EXPIRATION) {
  try {
    const stringValue = JSON.stringify(value);
    await redisClient.setex(key, expirationInSeconds, stringValue);
  } catch (error) {
    console.error('❌ Redis SETEX error:', error);
  }
}

/**
 * Creates a consistent, hashed key from a complex object.
 * @param {any} object - The object to create a key from (e.g., a message history array).
 * @returns {string} A SHA256 hash to be used as a cache key.
 */
function createKey(object) {
  const hash = crypto.createHash('sha256');
  const stringifiedObject = JSON.stringify(object);
  hash.update(stringifiedObject);
  return `cache:${hash.digest('hex')}`;
}

const cache = {
  get,
  set,
  createKey,
};

export default cache;

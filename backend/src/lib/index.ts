/**
 * @fileoverview Library Barrel Export
 * Centralized exports for all libs in backend/src/lib
 *
 * Usage: import { cache, redis, connectionManager } from './lib/index.js';
 */

import { cacheService } from '../services/cache.js';

// Cache utilities
export const cache = cacheService;
export { default as redis } from './redis.js';

// File utilities
export { default as exif } from './exif.js';
export { default as simple } from './simple.js';

// Queue management
export * as queues from './queues.js';

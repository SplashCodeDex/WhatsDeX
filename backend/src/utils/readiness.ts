import { db } from '../lib/firebase.js';
import { Redis } from 'ioredis';

async function firestoreCheck(timeoutMs: number = 5000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Firestore ping timeout'));
    }, timeoutMs);

    db.collection('health').limit(1).get()
      .then(() => {
        clearTimeout(timeout);
        resolve(true);
      })
      .catch((err) => {
        clearTimeout(timeout);
        reject(err);
      });
  });
}

export async function waitForFirestore({
  maxRetries = parseInt(process.env.READINESS_MAX_RETRIES || '30', 10),
  intervalMs = parseInt(process.env.READINESS_INTERVAL_MS || '2000', 10),
  timeoutMs = parseInt(process.env.READINESS_TIMEOUT_MS || '5000', 10),
  logger = console,
} = {} as any) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await firestoreCheck(timeoutMs);
      logger.info?.(`✅ Firestore is ready (attempt ${attempt})`);
      return true;
    } catch (err: any) {
      logger.warn?.(`⏳ Firestore not ready yet (attempt ${attempt}/${maxRetries}): ${(err as any)?.message || err}`);
      if (attempt === maxRetries) break;
      await delay(intervalMs);
    }
  }
  throw new Error('Firestore readiness check failed');
}

function parseRedisEnv() {
  if (process.env.REDIS_URL) {
    try {
      const u = new globalThis.URL(process.env.REDIS_URL);
      return {
        host: u.hostname || 'localhost',
        port: parseInt(u.port || '6379', 10),
        password: u.password || undefined,
      };
    } catch { }
  }
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  };
}

export async function waitForRedis({
  host = parseRedisEnv().host,
  port = parseRedisEnv().port,
  password = parseRedisEnv().password,
  maxRetries = parseInt(process.env.READINESS_MAX_RETRIES || '30', 10),
  intervalMs = parseInt(process.env.READINESS_INTERVAL_MS || '2000', 10),
  logger = console,
} = {} as any) {
  let client: Redis | undefined;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      client = new Redis({ host, port, password, lazyConnect: true, enableOfflineQueue: false });
      await client.connect();
      const pong = await client.ping();
      await client.quit();
      if (pong === 'PONG') {
        logger.info?.(`✅ Redis is ready (attempt ${attempt})`);
        return true;
      }
      throw new Error(`Unexpected PING response: ${pong}`);
    } catch (err: any) {
      logger.warn?.(`⏳ Redis not ready yet (attempt ${attempt}/${maxRetries}): ${(err as any)?.message || err}`);
      try { if (client) await client.quit(); } catch { }
      if (attempt === maxRetries) break;
      await delay(intervalMs);
    }
  }
  throw new Error('Redis readiness check failed');
}

export async function waitForDependencies({ logger = console } = {} as any) {
  // Firestore (required for data and auth)
  await waitForFirestore({ logger });
  // Redis (optional, but many features rely on it). Only wait if host/port set.
  if (process.env.REDIS_HOST || process.env.REDIS_URL) {
    try {
      await waitForRedis({ logger });
    } catch (e) {
      logger.warn?.(`⚠️ Redis not ready. Continuing without Redis may degrade functionality: ${(e as any)?.message || e}`);
    }
  }
}

import net from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

function parseDbUrl(url) {
  try {
    const u = new globalThis.URL(url);
    return {
      host: u.hostname || 'localhost',
      port: parseInt(u.port || '5432', 10),
      user: decodeURIComponent(u.username || ''),
      password: decodeURIComponent(u.password || ''),
      database: (u.pathname || '').replace(/^\//, '') || 'postgres',
    };
  } catch {
    return { host: 'localhost', port: 5432 };
  }
}

async function tcpCheck(host, port, timeoutMs = 1000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const onDone = (ok) => {
      try { socket.destroy(); } catch {}
      resolve(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => onDone(true));
    socket.once('timeout', () => onDone(false));
    socket.once('error', () => onDone(false));
    socket.connect(port, host);
  });
}

export async function waitForPostgres({
  databaseUrl = process.env.DATABASE_URL,
  maxRetries = parseInt(process.env.READINESS_MAX_RETRIES || '30', 10),
  intervalMs = parseInt(process.env.READINESS_INTERVAL_MS || '2000', 10),
  tcpTimeoutMs = parseInt(process.env.READINESS_TCP_TIMEOUT_MS || '1000', 10),
  logger = console,
} = {}) {
  if (!databaseUrl) throw new Error('DATABASE_URL is required for Postgres readiness check');

  const { host, port } = parseDbUrl(databaseUrl);
  const prisma = new PrismaClient();

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Fast TCP readiness check first
      const tcpReady = await tcpCheck(host, port, tcpTimeoutMs);
      if (!tcpReady) throw new Error(`TCP not ready ${host}:${port}`);

      // Validate DB by running a trivial query
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      await prisma.$disconnect();
      logger.info?.(`✅ Postgres is ready (attempt ${attempt})`);
      return true;
    } catch (err) {
      logger.warn?.(`⏳ Postgres not ready yet (attempt ${attempt}/${maxRetries}): ${err?.message || err}`);
      try { await prisma.$disconnect(); } catch {}
      if (attempt === maxRetries) break;
      await delay(intervalMs);
    }
  }
  throw new Error('Postgres readiness check failed');
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
    } catch {}
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
} = {}) {
  let client;
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
    } catch (err) {
      logger.warn?.(`⏳ Redis not ready yet (attempt ${attempt}/${maxRetries}): ${err?.message || err}`);
      try { if (client) await client.quit(); } catch {}
      if (attempt === maxRetries) break;
      await delay(intervalMs);
    }
  }
  throw new Error('Redis readiness check failed');
}

export async function waitForDependencies({ logger = console } = {}) {
  // Postgres (required)
  await waitForPostgres({ logger });
  // Redis (optional, but many features rely on it). Only wait if host/port set.
  if (process.env.REDIS_HOST || process.env.REDIS_URL) {
    try {
      await waitForRedis({ logger });
    } catch (e) {
      logger.warn?.(`⚠️ Redis not ready. Continuing without Redis may degrade functionality: ${e?.message || e}`);
    }
  }
}

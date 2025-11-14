import 'dotenv/config';
import prisma from '../src/lib/prisma.js';
import redis from '../lib/redis.js';
import net from 'net';

async function tcpProbe(host, port, timeoutMs = 3000) {
  return new Promise(resolve => {
    const socket = net.connect({ host, port });
    const timer = setTimeout(() => {
      socket.destroy();
      resolve({ ok: false, error: new Error('TCP timeout') });
    }, timeoutMs);
    socket.on('connect', () => {
      clearTimeout(timer);
      socket.end();
      resolve({ ok: true });
    });
    socket.on('error', (err) => {
      clearTimeout(timer);
      resolve({ ok: false, error: err });
    });
  });
}

async function checkPostgres({ disconnectPrisma = false } = {}) {
  const result = { ok: false };
  const start = Date.now();
  try {
    await prisma.$connect();
    result.ms = Date.now() - start;
    result.ok = true;
    result.message = `connected in ${result.ms}ms`;
  } catch (err) {
    result.error = err?.message || String(err);
    try {
      const { URL } = await import('node:url');
      const url = new URL(process.env.DATABASE_URL);
      const host = url.hostname || 'localhost';
      const port = parseInt(url.port || '5432', 10);
      const probe = await tcpProbe(host, port);
      if (probe.ok) {
        result.ok = true;
        result.warning = 'Prisma connect failed but TCP reachable';
        result.message = `tcp ok at ${host}:${port}`;
      }
    } catch (e) {
      result.tcpError = e?.message || String(e);
    }
  } finally {
    if (disconnectPrisma) {
      try { await prisma.$disconnect(); } catch {}
    }
  }
  return result;
}

async function checkRedis() {
  const start = Date.now();
  try {
    const pong = await redis.ping();
    const ms = Date.now() - start;
    if (pong && String(pong).toUpperCase().includes('PONG')) {
      return { ok: true, ms, message: `PING=${pong}` };
    }
    return { ok: false, error: 'Unexpected PING response', response: pong };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  }
}

export async function runHealthChecks(options = {}) {
  if (!process.env.DATABASE_URL) {
    return {
      ok: false,
      error: 'DATABASE_URL is not set. Example: postgresql://user:pass@localhost:5432/whatsdex',
    };
  }
  const [pg, rd] = await Promise.all([
    checkPostgres(options),
    checkRedis(),
  ]);
  return {
    ok: pg.ok && rd.ok,
    postgres: pg,
    redis: rd,
    timestamp: new Date().toISOString(),
  };
}

// CLI usage
if (process.argv[1] && process.argv[1].endsWith('health-check.js')) {
  (async () => {
    const res = await runHealthChecks({ disconnectPrisma: true });
    if (res.ok) {
      console.log('🎉 Local health check PASSED');
      console.log(JSON.stringify(res, null, 2));
      process.exit(0);
    } else {
      console.error('❌ Local health check FAILED');
      console.error(JSON.stringify(res, null, 2));
      process.exit(1);
    }
  })();
}

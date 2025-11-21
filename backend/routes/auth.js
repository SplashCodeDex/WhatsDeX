import express from 'express';
import UnifiedSmartAuth from '../src/services/auth/UnifiedSmartAuth.js';
import AutoReconnectionEngine from '../src/services/autoReconnectionEngine.js';
import context from '../context.js';

const router = express.Router();

// Initialize services
const unifiedAuth = new UnifiedSmartAuth({
  bot: {
    phoneNumber: process.env.BOT_PHONE_NUMBER || '1234567890',
    authAdapter: {
      default: {
        authDir: './auth_info_baileys',
      },
    },
  },
});
const reconnectionEngine = new AutoReconnectionEngine();

// Persistent session storage via Prisma
let connectionStatus = {
  status: 'disconnected',
  qrCode: null,
  pairingCode: null,
  retryCount: 0,
  connectionTime: 0,
  progress: 0,
  sessionId: null,
};

// WebSocket connections for real-time updates
const webSocketClients = new Set();

// Broadcast to all connected WebSocket clients
const broadcast = (event, data) => {
  webSocketClients.forEach(client => {
    if (client.readyState === 1) {
      // OPEN
      client.send(JSON.stringify({ event, data }));
    }
  });
};

// Update connection status and broadcast with database persistence
const updateConnectionStatus = async (status, additionalData = {}) => {
  connectionStatus = { ...connectionStatus, ...status, ...additionalData };

  // Persist session data to database
  if (connectionStatus.sessionId) {
    try {
      await context.database.userSession.upsert({
        where: { id: connectionStatus.sessionId },
        update: {
          status: connectionStatus.status,
          qrCode: connectionStatus.qrCode,
          pairingCode: connectionStatus.pairingCode,
          retryCount: connectionStatus.retryCount,
          connectionTime: connectionStatus.connectionTime,
          progress: connectionStatus.progress,
          updatedAt: new Date(),
        },
        create: {
          id: connectionStatus.sessionId,
          userId: 'system', // System session for bot
          status: connectionStatus.status,
          qrCode: connectionStatus.qrCode,
          pairingCode: connectionStatus.pairingCode,
          retryCount: connectionStatus.retryCount,
          connectionTime: connectionStatus.connectionTime,
          progress: connectionStatus.progress,
        },
      });
    } catch (error) {
      console.error('Failed to persist session status:', error);
    }
  }

  broadcast('connection_status', connectionStatus);
};

// API Routes

/**
 * GET /api/auth/status
 * Get current authentication status
 */
router.get('/status', async (req, res) => {
  try {
    // Load latest session data from database
    if (connectionStatus.sessionId) {
      const sessionData = await context.database.userSession.findUnique({
        where: { id: connectionStatus.sessionId },
      });
      if (sessionData) {
        connectionStatus = {
          ...connectionStatus,
          status: sessionData.status,
          qrCode: sessionData.qrCode,
          pairingCode: sessionData.pairingCode,
          retryCount: sessionData.retryCount,
          connectionTime: sessionData.connectionTime,
          progress: sessionData.progress,
        };
      }
    }

    res.json({
      success: true,
      data: {
        ...connectionStatus,
        analytics: {
          reconnectionStats: reconnectionEngine.getStats(),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve status',
      error: error.message,
    });
  }
});

/**
 * POST /api/auth/start
 * Start authentication process
 */
router.post('/start', async (req, res) => {
  try {
    const { method = 'qr', voiceEnabled = false, phoneNumber } = req.body;

    // Create session ID for persistence
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    connectionStatus.sessionId = sessionId;

    // Update status to connecting
    await updateConnectionStatus({
      status: 'connecting',
      retryCount: 0,
      connectionTime: 0,
      progress: 10,
    });

    if (method === 'qr') {
      // Generate real QR code using UnifiedSmartAuth
      await unifiedAuth.connect();
      const qrCode = await unifiedAuth.getQRCode();

      await updateConnectionStatus({
        qrCode,
        progress: 30,
      });

      // Listen for connection events
      unifiedAuth.once('connected', async () => {
        await updateConnectionStatus({
          status: 'connected',
          progress: 100,
          connectionTime: Date.now(),
        });
      });
    } else if (method === 'pairing') {
      // Generate real pairing code using UnifiedSmartAuth
      await unifiedAuth.connect();
      const pairingCode = await unifiedAuth.getPairingCode(phoneNumber);

      await updateConnectionStatus({
        pairingCode,
        progress: 30,
      });

      // Listen for connection events
      unifiedAuth.once('connected', async () => {
        await updateConnectionStatus({
          status: 'connected',
          progress: 100,
          connectionTime: Date.now(),
        });
      });
    }

    res.json({
      success: true,
      message: 'Authentication process started',
      data: { method, sessionId },
    });
  } catch (error) {
    await updateConnectionStatus({
      status: 'error',
      error: error.message,
    });

    res.status(500).json({
      success: false,
      message: 'Failed to start authentication',
      error: error.message,
    });
  }
});

/**
 * POST /api/auth/stop
 * Stop authentication process
 */
router.post('/stop', async (req, res) => {
  try {
    // Disconnect from WhatsApp
    await unifiedAuth.disconnect();

    await updateConnectionStatus({
      status: 'disconnected',
      qrCode: null,
      pairingCode: null,
      progress: 0,
    });

    res.json({
      success: true,
      message: 'Authentication process stopped',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to stop authentication',
      error: error.message,
    });
  }
});

/**
 * POST /api/auth/refresh-qr
 * Refresh QR code
 */
router.post('/refresh-qr', async (req, res) => {
  try {
    // Get fresh QR code from UnifiedSmartAuth
    const newQR = await unifiedAuth.getQRCode();

    if (!newQR) {
      return res.status(400).json({
        success: false,
        message: 'Unable to generate new QR code',
      });
    }

    await updateConnectionStatus({
      qrCode: newQR,
    });

    res.json({
      success: true,
      message: 'QR code refreshed',
      data: newQR,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to refresh QR code',
      error: error.message,
    });
  }
});

/**
 * POST /api/auth/refresh-pairing
 * Refresh pairing code
 */
router.post('/refresh-pairing', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required',
      });
    }

    const newPairingCode = await unifiedAuth.getPairingCode(phoneNumber);

    await updateConnectionStatus({
      pairingCode: newPairingCode,
    });

    res.json({
      success: true,
      message: 'Pairing code refreshed',
      data: newPairingCode,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to refresh pairing code',
      error: error.message,
    });
  }
});

/**
 * GET /api/auth/analytics
 * Get authentication analytics
 */
router.get('/analytics', async (req, res) => {
  try {
    // Get real analytics from database
    const totalConnections = await context.database.userSession.count({
      where: { status: 'connected' },
    });

    const successfulConnections = await context.database.userSession.count({
      where: {
        status: 'connected',
        connectionTime: { not: null },
      },
    });

    const avgConnectionTime = await context.database.userSession.aggregate({
      _avg: { connectionTime: true },
      where: { connectionTime: { not: null } },
    });

    const analytics = {
      reconnectionStats: reconnectionEngine.getStats(),
      overall: {
        totalConnections,
        successRate: totalConnections > 0 ? (successfulConnections / totalConnections) * 100 : 0,
        averageConnectionTime: avgConnectionTime._avg.connectionTime || 0,
        activeConnections: connectionStatus.status === 'connected' ? 1 : 0,
      },
    };

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve analytics',
      error: error.message,
    });
  }
});

/**
 * POST /api/auth/disconnect
 * Handle disconnection
 */
router.post('/disconnect', async (req, res) => {
  try {
    const { reason = 'manual' } = req.body;

    // Disconnect from WhatsApp first
    await unifiedAuth.disconnect();

    // Trigger reconnection engine with real network monitoring
    await reconnectionEngine.handleDisconnection(reason, {
      networkType: 'unknown', // Could be detected from system
      deviceType: 'server',
      userActivity: 'manual_disconnect',
    });

    await updateConnectionStatus({
      status: 'disconnected',
      qrCode: null,
      pairingCode: null,
      progress: 0,
    });

    res.json({
      success: true,
      message: 'Disconnection handled, reconnection initiated',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to handle disconnection',
      error: error.message,
    });
  }
});

/**
 * WebSocket upgrade handler
 * Guarded with defensive check for router.ws availability
 */
if (typeof router.ws === 'function') {
  router.ws?.('/ws', (ws, req) => {
    webSocketClients.add(ws);

    // Send initial status
    ws.send(
      JSON.stringify({
        event: 'connection_status',
        data: connectionStatus,
      })
    );

    // Handle client messages
    ws.on('message', message => {
      try {
        const data = JSON.parse(message.toString());

        switch (data.type) {
          case 'get_status':
            ws.send(
              JSON.stringify({
                event: 'connection_status',
                data: connectionStatus,
              })
            );
            break;

          case 'start_connection':
            // Handle connection start via WebSocket
            break;

          case 'stop_connection':
            updateConnectionStatus({
              status: 'disconnected',
              qrCode: null,
              pairingCode: null,
              progress: 0,
            });
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    // Handle client disconnect
    ws.on('close', () => {
      webSocketClients.delete(ws);
    });

    // Handle errors
    ws.on('error', error => {
      console.error('WebSocket error:', error);
      webSocketClients.delete(ws);
    });
  });
} else {
  // Fallback: WebSocket not available, router.ws not supported
  console.warn(
    'WebSocket support not available for auth router. Consider using socket.io as alternative.'
  );
}

/**
 * GET /api/auth/qr-stats
 * Get QR code statistics from database
 */
router.get('/qr-stats', async (req, res) => {
  try {
    const qrSessions = await context.database.userSession.findMany({
      where: { qrCode: { not: null } },
      select: {
        createdAt: true,
        updatedAt: true,
        status: true,
      },
    });

    const stats = {
      totalGenerated: qrSessions.length,
      successfulScans: qrSessions.filter(s => s.status === 'connected').length,
      averageGenerationTime: 0, // Could calculate from timestamps
      lastGenerated: qrSessions[qrSessions.length - 1]?.createdAt || null,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve QR stats',
      error: error.message,
    });
  }
});

/**
 * GET /api/auth/pairing-stats
 * Get pairing code statistics from database
 */
router.get('/pairing-stats', async (req, res) => {
  try {
    const pairingSessions = await context.database.userSession.findMany({
      where: { pairingCode: { not: null } },
      select: {
        createdAt: true,
        updatedAt: true,
        status: true,
      },
    });

    const stats = {
      totalGenerated: pairingSessions.length,
      successfulUses: pairingSessions.filter(s => s.status === 'connected').length,
      averageGenerationTime: 0, // Could calculate from timestamps
      lastGenerated: pairingSessions[pairingSessions.length - 1]?.createdAt || null,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve pairing stats',
      error: error.message,
    });
  }
});

/**
 * GET /api/auth/reconnection-stats
 * Get reconnection engine statistics
 */
router.get('/reconnection-stats', (req, res) => {
  res.json({
    success: true,
    data: reconnectionEngine.getStats(),
  });
});

/**
 * POST /api/auth/validate-pairing
 * Validate pairing code (now handled by UnifiedSmartAuth events)
 */
router.post('/validate-pairing', (req, res) => {
  // Pairing code validation is now handled automatically by UnifiedSmartAuth
  // This endpoint is kept for backward compatibility
  res.json({
    success: true,
    message: 'Pairing code validation is handled automatically',
    data: { valid: true, autoValidated: true },
  });
});

/**
 * POST /api/auth/record-scan
 * Record QR code scan (now handled automatically)
 */
router.post('/record-scan', async (req, res) => {
  try {
    const { qrId, success = true, scanTime } = req.body;

    // Record scan event in database
    await context.database.userSession.updateMany({
      where: { qrCode: qrId },
      data: {
        status: success ? 'connected' : 'failed',
        connectionTime: success ? scanTime : null,
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Scan recorded successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to record scan',
      error: error.message,
    });
  }
});

/**
 * POST /api/auth/record-usage
 * Record pairing code usage (now handled automatically)
 */
router.post('/record-usage', async (req, res) => {
  try {
    const { codeId, success = true, useTime, accessibilityUsed = false } = req.body;

    // Record usage event in database
    await context.database.userSession.updateMany({
      where: { pairingCode: codeId },
      data: {
        status: success ? 'connected' : 'failed',
        connectionTime: success ? useTime : null,
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Usage recorded successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to record usage',
      error: error.message,
    });
  }
});

// Cleanup expired sessions periodically
setInterval(async () => {
  try {
    // Clean up old disconnected sessions
    await context.database.userSession.deleteMany({
      where: {
        status: 'disconnected',
        updatedAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Older than 24 hours
        },
      },
    });
  } catch (error) {
    console.error('Failed to cleanup expired sessions:', error);
  }
}, 60000); // Every minute

// Graceful shutdown
process.on('SIGINT', async () => {
  await unifiedAuth.disconnect();
  await reconnectionEngine.shutdown();
});

process.on('SIGTERM', async () => {
  await unifiedAuth.disconnect();
  await reconnectionEngine.shutdown();
});

// Single enhanced logout endpoint for session invalidation
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret');
    const sessionId = decoded.sessionId || `session_${decoded.userId}`;

    const invalidTokens = new Set(); // Fallback in-memory

    if (process.env.REDIS_URL) {
      const { createClient } = require('redis');
      const redis = createClient({ url: process.env.REDIS_URL });
      await redis.connect();
      await redis.del(sessionId);
      await redis.setEx(`invalid_token:${token}`, 3600, '1'); // 1h expiration
      await redis.quit();
    } else {
      invalidTokens.add(token);
    }

    res.json({ success: true, message: 'Session invalidated' });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed', message: error.message });
  }
});

// Public Registration Endpoint (SaaS best-practice)
// POST /api/auth/register
// Creates tenant + admin user + default bot, then authenticates and returns token
(() => {
  const ipHits = new Map(); // basic in-memory rate limiter (consider Redis for prod)
  const WINDOW_MS = parseInt(process.env.REG_LIMIT_WINDOW_MS || '', 10) || 5 * 60 * 1000; // default 5 minutes
  const MAX_HITS = parseInt(process.env.REG_LIMIT_MAX || '', 10) || 10; // default 10 attempts per key per window
  const WHITELIST_IPS = (process.env.REG_LIMIT_WHITELIST_IPS || '127.0.0.1,::1,localhost').split(',').map(s => s.trim());

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const subdomainRegex = /^[a-z0-9-]{3,20}$/;

  const getMultiTenantService = async () => {
    const mod = await import('../src/services/multiTenantService.js');
    return mod.default || mod;
  };

  // Availability check endpoint for registration (email + subdomain)
  router.get('/register/availability', async (req, res) => {
    try {
      const { email = '', subdomain = '' } = req.query || {};
      const mt = await getMultiTenantService();

      const payload = { email: { available: true }, subdomain: { available: true } };
      if (!email && !subdomain) {
        return res.status(400).json({ error: 'Provide email or subdomain to check' });
      }
      if (email) {
        const existingByEmail = await mt.prisma.tenant.findUnique({ where: { email: String(email).toLowerCase() } });
        if (existingByEmail) {
          payload.email = { available: false, reason: 'Email already registered' };
        }
      }
      if (subdomain) {
        const existingBySub = await mt.prisma.tenant.findUnique({ where: { subdomain: String(subdomain).toLowerCase() } });
        if (existingBySub) {
          payload.subdomain = { available: false, reason: 'Subdomain already taken' };
        }
      }
      return res.json({ success: true, ...payload });
    } catch (error) {
      console.error('Availability check error:', error);
      return res.status(500).json({ error: 'Failed to check availability' });
    }
  });

  router.post('/register', async (req, res) => {
    try {
      // Basic rate limiting per key (IP + email to avoid penalizing shared IPs)
      const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.connection?.remoteAddress || 'unknown';
      // Whitelist certain IPs (local/dev/CDN health checks)
      if (WHITELIST_IPS.includes(ip)) {
        // skip rate limiting
      } else {
        const previewBody = req.body || {};
        const keySuffix = (previewBody?.email || '').toLowerCase();
        const key = `${ip}:${keySuffix || 'anonymous'}`;
        const now = Date.now();
        const recentHits = (ipHits.get(key) || []).filter(ts => now - ts < WINDOW_MS);
        const remaining = Math.max(0, MAX_HITS - recentHits.length);
        if (recentHits.length >= MAX_HITS) {
          const retryAfterMs = WINDOW_MS - (now - recentHits[0]);
          res.set('Retry-After', Math.ceil(retryAfterMs / 1000));
          res.set('X-RateLimit-Limit', String(MAX_HITS));
          res.set('X-RateLimit-Remaining', '0');
          res.set('X-RateLimit-Reset', String(Math.ceil((now + retryAfterMs) / 1000)));
          return res.status(429).json({ 
            error: 'We’re receiving too many sign‑up attempts from your network right now.',
            code: 'RATE_LIMITED',
            remainingAttempts: 0,
            retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
            hint: 'Wait a couple of minutes or try with a different email. Contact support if this persists.'
          });
        }
        recentHits.push(now);
        ipHits.set(key, recentHits);
        res.set('X-RateLimit-Limit', String(MAX_HITS));
        res.set('X-RateLimit-Remaining', String(Math.max(0, remaining - 1)));
      }

      const {
        companyName,
        subdomain,
        email,
        name,
        password,
        phone,
        plan = 'free',
      } = req.body || {};

      // Validate input (do not count validation failures harshly; rate limit primarily creation attempts)
      if (!companyName || typeof companyName !== 'string' || companyName.trim().length < 2) {
        return res.status(400).json({ error: 'Invalid companyName' });
      }
      if (!subdomain || !subdomainRegex.test(subdomain)) {
        return res.status(400).json({ error: 'Invalid subdomain. Use 3-20 lowercase letters, numbers, and hyphens.' });
      }
      if (!email || !emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email' });
      }
      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({ error: 'Invalid name' });
      }
      if (!password || typeof password !== 'string' || password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
      }

      // Optional CAPTCHA verification hook (Turnstile/Recaptcha)
      // if (process.env.TURNSTILE_SECRET) { /* verify token from req.body.captchaToken */ }

      const multiTenantService = await getMultiTenantService();

      // Create tenant + admin user + default bot
      const result = await multiTenantService.createTenant({
        name: companyName.trim(),
        subdomain: subdomain.trim(),
        email: email.trim(),
        phone: phone?.trim() || null,
        adminUser: {
          email: email.trim(),
          name: name.trim(),
          password,
        },
      });

      // Immediately authenticate admin user
      const auth = await multiTenantService.authenticateUser(result.tenant.id, email.trim(), password);

      // Success: adjust rate limiter window so next attempt is not unfairly blocked
      try {
        const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.connection?.remoteAddress || 'unknown';
        const keySuffix = (email || '').toLowerCase();
        const key = `${ip}:${keySuffix || 'anonymous'}`;
        const now = Date.now();
        const recentHits = (ipHits.get(key) || []).filter(ts => now - ts < WINDOW_MS);
        // Keep only the most recent successful attempt
        ipHits.set(key, recentHits.slice(-1));
      } catch {}

      // Record analytics and audit (best-effort)
      try {
        await multiTenantService.recordAnalytic(result.tenant.id, 'tenant_registered', 1, { plan });
      } catch {}
      try {
        await multiTenantService.logAction(
          result.tenant.id,
          result.user.id,
          'tenant_created',
          'tenant',
          result.tenant.id,
          { plan, subdomain },
          ip,
          req.headers['user-agent'] || ''
        );
      } catch {}

      return res.status(201).json({
        success: true,
        token: auth.token,
        user: auth.user,
        tenant: auth.tenant,
        botInstance: {
          id: result.botInstance.id,
          name: result.botInstance.name,
          status: result.botInstance.status,
        },
      });
    } catch (error) {
      console.error('Public register error:', error);
      let status = 500;
      let message = 'Registration failed';
      let code = 'REGISTRATION_FAILED';
      let field = undefined;

      if (error && error.code === 'P2002') {
        status = 409;
        code = 'CONFLICT';
        const target = (error.meta && error.meta.target) || [];
        if (Array.isArray(target) && target.includes('email')) {
          message = 'Email already registered';
          field = 'email';
        } else if (Array.isArray(target) && target.includes('subdomain')) {
          message = 'Subdomain already taken';
          field = 'subdomain';
        } else {
          message = 'Resource already exists';
        }
      } else if (typeof error?.message === 'string') {
        if (/subdomain.*taken/i.test(error.message)) {
          status = 409; code = 'CONFLICT'; message = 'Subdomain already taken'; field = 'subdomain';
        } else if (/email.*(exists|taken|registered)/i.test(error.message)) {
          status = 409; code = 'CONFLICT'; message = 'Email already registered'; field = 'email';
        } else if (/already|exists|taken/i.test(error.message)) {
          status = 409; code = 'CONFLICT'; message = 'Resource already exists';
        } else {
          message = error.message;
        }
      }

      const body = { error: message, code };
      if (field) body.field = field;
      return res.status(status).json(body);
    }
  });
})();

export default router;

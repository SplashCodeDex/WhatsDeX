const express = require('express');

const router = express.Router();
const UnifiedSmartAuth = require('../src/services/auth/UnifiedSmartAuth');
const AutoReconnectionEngine = require('../src/services/autoReconnectionEngine');
const context = require('../context');

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
  router.ws('/ws', (ws, req) => {
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

module.exports = router;

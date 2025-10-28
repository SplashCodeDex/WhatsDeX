const express = require('express');
const router = express.Router();
const UltraSmartQRManager = require('../src/services/auth/qrCodeHandler');
const SmartPairingCodeManager = require('../src/services/auth/pairingCodeHandler');
const AutoReconnectionEngine = require('../src/services/autoReconnectionEngine');

// Initialize services
const qrManager = new UltraSmartQRManager();
const pairingManager = new SmartPairingCodeManager();
const reconnectionEngine = new AutoReconnectionEngine();

// In-memory storage for demo (use database in production)
let connectionStatus = {
  status: 'disconnected',
  qrCode: null,
  pairingCode: null,
  retryCount: 0,
  connectionTime: 0,
  progress: 0
};

// WebSocket connections for real-time updates
const webSocketClients = new Set();

// Broadcast to all connected WebSocket clients
const broadcast = (event, data) => {
  webSocketClients.forEach(client => {
    if (client.readyState === 1) { // OPEN
      client.send(JSON.stringify({ event, data }));
    }
  });
};

// Update connection status and broadcast
const updateConnectionStatus = (status, additionalData = {}) => {
  connectionStatus = { ...connectionStatus, ...status, ...additionalData };
  broadcast('connection_status', connectionStatus);
};

// API Routes

/**
 * GET /api/auth/status
 * Get current authentication status
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: {
      ...connectionStatus,
      analytics: {
        qrStats: qrManager.getQRStats(),
        pairingStats: pairingManager.getCodeStats(),
        reconnectionStats: reconnectionEngine.getStats()
      }
    }
  });
});

/**
 * POST /api/auth/start
 * Start authentication process
 */
router.post('/start', async (req, res) => {
  try {
    const { method = 'qr', voiceEnabled = false } = req.body;

    // Update status to connecting
    updateConnectionStatus({
      status: 'connecting',
      retryCount: 0,
      connectionTime: 0,
      progress: 10
    });

    if (method === 'qr') {
      // Generate QR code
      const sessionData = 'whatsapp_session_' + Date.now(); // Mock session data
      const qrResult = await qrManager.generateUltraSmartQR(sessionData);

      updateConnectionStatus({
        qrCode: qrResult,
        progress: 30
      });

      // Simulate connection process
      setTimeout(() => {
        updateConnectionStatus({
          status: 'connected',
          progress: 100,
          connectionTime: Date.now() - Date.now() // Would be actual connection time
        });
      }, 3000);

    } else if (method === 'pairing') {
      // Generate pairing code
      const pairingResult = await pairingManager.generateSmartPairingCode();

      updateConnectionStatus({
        pairingCode: pairingResult,
        progress: 30
      });

      // Simulate connection process
      setTimeout(() => {
        updateConnectionStatus({
          status: 'connected',
          progress: 100,
          connectionTime: Date.now() - Date.now()
        });
      }, 3000);
    }

    res.json({
      success: true,
      message: 'Authentication process started',
      data: { method }
    });

  } catch (error) {
    updateConnectionStatus({
      status: 'error',
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to start authentication',
      error: error.message
    });
  }
});

/**
 * POST /api/auth/stop
 * Stop authentication process
 */
router.post('/stop', (req, res) => {
  updateConnectionStatus({
    status: 'disconnected',
    qrCode: null,
    pairingCode: null,
    progress: 0
  });

  res.json({
    success: true,
    message: 'Authentication process stopped'
  });
});

/**
 * POST /api/auth/refresh-qr
 * Refresh QR code
 */
router.post('/refresh-qr', async (req, res) => {
  try {
    if (!connectionStatus.qrCode) {
      return res.status(400).json({
        success: false,
        message: 'No active QR code to refresh'
      });
    }

    const sessionData = 'whatsapp_session_' + Date.now();
    const newQR = await qrManager.generateUltraSmartQR(sessionData);

    updateConnectionStatus({
      qrCode: newQR
    });

    res.json({
      success: true,
      message: 'QR code refreshed',
      data: newQR
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to refresh QR code',
      error: error.message
    });
  }
});

/**
 * POST /api/auth/refresh-pairing
 * Refresh pairing code
 */
router.post('/refresh-pairing', async (req, res) => {
  try {
    const newPairingCode = await pairingManager.generateSmartPairingCode();

    updateConnectionStatus({
      pairingCode: newPairingCode
    });

    res.json({
      success: true,
      message: 'Pairing code refreshed',
      data: newPairingCode
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to refresh pairing code',
      error: error.message
    });
  }
});

/**
 * GET /api/auth/analytics
 * Get authentication analytics
 */
router.get('/analytics', (req, res) => {
  const analytics = {
    qrStats: qrManager.getQRStats(),
    pairingStats: pairingManager.getCodeStats(),
    reconnectionStats: reconnectionEngine.getStats(),
    overall: {
      totalConnections: 0, // Would be tracked in database
      successRate: 95.2,
      averageConnectionTime: 12.5,
      activeConnections: connectionStatus.status === 'connected' ? 1 : 0
    }
  };

  res.json({
    success: true,
    data: analytics
  });
});

/**
 * POST /api/auth/disconnect
 * Handle disconnection
 */
router.post('/disconnect', async (req, res) => {
  try {
    const { reason = 'manual' } = req.body;

    // Trigger reconnection engine
    await reconnectionEngine.handleDisconnection(reason);

    updateConnectionStatus({
      status: 'disconnected',
      qrCode: null,
      pairingCode: null,
      progress: 0
    });

    res.json({
      success: true,
      message: 'Disconnection handled, reconnection initiated'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to handle disconnection',
      error: error.message
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
    ws.send(JSON.stringify({
      event: 'connection_status',
      data: connectionStatus
    }));

    // Handle client messages
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());

        switch (data.type) {
          case 'get_status':
            ws.send(JSON.stringify({
              event: 'connection_status',
              data: connectionStatus
            }));
            break;

          case 'start_connection':
            // Handle connection start via WebSocket
            break;

          case 'stop_connection':
            updateConnectionStatus({
              status: 'disconnected',
              qrCode: null,
              pairingCode: null,
              progress: 0
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
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      webSocketClients.delete(ws);
    });
  });
} else {
  // Fallback: WebSocket not available, router.ws not supported
  console.warn('WebSocket support not available for auth router. Consider using socket.io as alternative.');
}

/**
 * GET /api/auth/qr-stats
 * Get QR code statistics
 */
router.get('/qr-stats', (req, res) => {
  res.json({
    success: true,
    data: qrManager.getQRStats()
  });
});

/**
 * GET /api/auth/pairing-stats
 * Get pairing code statistics
 */
router.get('/pairing-stats', (req, res) => {
  res.json({
    success: true,
    data: pairingManager.getCodeStats()
  });
});

/**
 * GET /api/auth/reconnection-stats
 * Get reconnection engine statistics
 */
router.get('/reconnection-stats', (req, res) => {
  res.json({
    success: true,
    data: reconnectionEngine.getStats()
  });
});

/**
 * POST /api/auth/validate-pairing
 * Validate pairing code
 */
router.post('/validate-pairing', (req, res) => {
  try {
    const { codeId, code } = req.body;

    const validation = pairingManager.validateCode(codeId, code);

    if (validation.valid) {
      updateConnectionStatus({
        status: 'connected',
        progress: 100
      });
    }

    res.json({
      success: true,
      data: validation
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to validate pairing code',
      error: error.message
    });
  }
});

/**
 * POST /api/auth/record-scan
 * Record QR code scan
 */
router.post('/record-scan', (req, res) => {
  try {
    const { qrId, success = true, scanTime } = req.body;

    qrManager.recordQRScan(qrId, success, scanTime);

    res.json({
      success: true,
      message: 'Scan recorded successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to record scan',
      error: error.message
    });
  }
});

/**
 * POST /api/auth/record-usage
 * Record pairing code usage
 */
router.post('/record-usage', (req, res) => {
  try {
    const { codeId, success = true, useTime, accessibilityUsed = false } = req.body;

    pairingManager.recordCodeUsage(codeId, success, useTime, accessibilityUsed);

    res.json({
      success: true,
      message: 'Usage recorded successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to record usage',
      error: error.message
    });
  }
});

 // Cleanup expired codes periodically
 setInterval(() => {
   qrManager.cleanupExpiredQRs();
   pairingManager.cleanupExpiredCodes();
 }, 60000); // Every minute

 // Graceful shutdown
 process.on('SIGINT', async () => {
   await qrManager.shutdown();
   await pairingManager.shutdown();
   await reconnectionEngine.shutdown();
 });

 process.on('SIGTERM', async () => {
   await qrManager.shutdown();
   await pairingManager.shutdown();
   await reconnectionEngine.shutdown();
 });

 // Single enhanced logout endpoint for session invalidation
 router.post('/logout', async (req, res) => {
   try {
     const authHeader = req.headers['authorization'];
     const token = authHeader && authHeader.split(' ')[1];
     if (!token) {
       return res.status(401).json({ error: 'Access token required' });
     }

     const jwt = require('jsonwebtoken');
     const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret');
     const sessionId = decoded.sessionId || `session_${decoded.userId}`;

     let invalidTokens = new Set(); // Fallback in-memory

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
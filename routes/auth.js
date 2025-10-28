const express = require('express');
const router = express.Router();
const SessionManager = require('../services/sessionManager');
const prisma = require('../services/database').prisma; // Assuming prisma is exported from here
const webSocketManager = require('../services/websocketManager'); // Assuming a websocket manager

// API Routes
router.get('/status', async (req, res) => {
  const sessionId = req.session.id; // Assuming express-session is used
  if (!sessionId) {
    return res.json({ success: true, data: { status: 'disconnected' } });
  }

  const session = await SessionManager.getSession(sessionId);
  if (!session) {
    return res.json({ success: true, data: { status: 'disconnected' } });
  }

  res.json({ success: true, data: { status: 'connected', user: session.userId } });
});

router.post('/start', async (req, res) => {
  const { userId } = req.body; // In a real app, this would come from a login process
  const deviceInfo = {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    platform: 'web',
  };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const session = await SessionManager.createSession(userId, deviceInfo);
  req.session.id = session.id; // Store session ID

  webSocketManager.broadcast('connection_status', { status: 'connected', user: userId });

  res.json({ success: true, message: 'Authentication successful', data: { session } });
});

router.post('/stop', async (req, res) => {
  const sessionId = req.session.id;
  if (sessionId) {
    const session = await SessionManager.endSession(sessionId);
    if (session) {
        webSocketManager.broadcast('connection_status', { status: 'disconnected', user: session.userId });
    }
    req.session.destroy();
  }
  res.json({ success: true, message: 'Authentication process stopped' });
});

module.exports = router;

import sessionManager from '../../../../../src/services/sessionManager.js';

export default async function handler(req, res) {
  const { params } = req.query;
  const [userId, sessionId = 'default'] = params;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    switch (req.method) {
      case 'POST':
        // Initialize new session
        const session = await sessionManager.createSession(userId, sessionId);
        res.status(200).json({
          success: true,
          sessionId: session.sessionId,
          message: 'Session initialized. QR code will be generated shortly.'
        });
        break;

      case 'GET':
        // Get session status
        const existingSession = sessionManager.getSession(userId, sessionId);
        if (!existingSession) {
          return res.status(404).json({ error: 'Session not found' });
        }

        res.status(200).json({
          sessionId: existingSession.sessionId,
          connected: existingSession.connected,
          lastSeen: existingSession.lastSeen,
          hasQrCode: !!existingSession.qrCode,
          hasPairingCode: !!existingSession.pairingCode
        });
        break;

      case 'DELETE':
        // Disconnect session
        await sessionManager.deleteSession(userId, sessionId);
        res.status(200).json({
          success: true,
          message: 'Session disconnected successfully'
        });
        break;

      default:
        res.setHeader('Allow', ['POST', 'GET', 'DELETE']);
        res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('Session API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
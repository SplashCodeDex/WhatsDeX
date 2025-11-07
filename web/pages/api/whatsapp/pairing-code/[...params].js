import sessionManager from '../../../../../src/services/sessionManager.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const { params } = req.query;
  const [userId, sessionId = 'default'] = params;
  const { phoneNumber } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  if (!phoneNumber) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  // Validate phone number format
  const cleanPhoneNumber = phoneNumber.replace(/[^\d+]/g, '');
  if (!cleanPhoneNumber.match(/^\+?[\d]{10,15}$/)) {
    return res.status(400).json({ 
      error: 'Invalid phone number format. Use international format: +1234567890' 
    });
  }

  try {
    const code = await sessionManager.generatePairingCode(userId, sessionId, cleanPhoneNumber);
    
    res.status(200).json({
      success: true,
      code,
      phoneNumber: cleanPhoneNumber,
      message: 'Pairing code generated successfully',
      instructions: [
        'Open WhatsApp on your phone',
        'Go to Settings → Linked Devices',
        'Tap "Link a Device"',
        'Choose "Link with phone number instead"',
        'Enter the provided code'
      ]
    });
  } catch (error) {
    console.error('Pairing code generation error:', error);
    res.status(500).json({
      error: 'Failed to generate pairing code',
      message: error.message
    });
  }
}
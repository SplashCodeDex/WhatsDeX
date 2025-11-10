import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { io } from 'socket.io-client';

const WhatsAppQRCode = ({ userId, sessionId = 'default' }) => {
  const [qrCode, setQrCode] = useState(null);
  const [pairingCode, setPairingCode] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Initialize WebSocket connection
    const socketConnection = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000', {
      query: { userId, sessionId }
    });

    setSocket(socketConnection);

    // Join user room for real-time updates
    socketConnection.emit('join-user-room', userId);

    // Listen for WhatsApp status updates
    socketConnection.on('whatsapp-status', (data) => {
      console.log('WhatsApp status update:', data);
      
      switch (data.event) {
        case 'qr-code':
          setQrCode(data.data);
          setPairingCode(null);
          setConnectionStatus('waiting-scan');
          break;
        case 'pairing-code':
          setPairingCode(data.data);
          setQrCode(null);
          setConnectionStatus('waiting-pair');
          break;
        case 'connected':
          setQrCode(null);
          setPairingCode(null);
          setConnectionStatus('connected');
          break;
        case 'disconnected':
          setConnectionStatus('disconnected');
          break;
      }
    });

    // Request current session status
    socketConnection.emit('get-session-status', { userId, sessionId });

    return () => {
      socketConnection.disconnect();
    };
  }, [userId, sessionId]);

  const initializeSession = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/whatsapp/session/${userId}/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        setConnectionStatus('initializing');
      } else {
        console.error('Failed to initialize session');
      }
    } catch (error) {
      console.error('Error initializing session:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePairingCode = async () => {
    if (!phoneNumber) {
      alert('Please enter your phone number');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/whatsapp/pairing-code/${userId}/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setPairingCode(data.code);
        setQrCode(null);
        setConnectionStatus('waiting-pair');
      } else {
        alert('Failed to generate pairing code: ' + data.error);
      }
    } catch (error) {
      console.error('Error generating pairing code:', error);
      alert('Error generating pairing code');
    } finally {
      setLoading(false);
    }
  };

  const disconnectSession = async () => {
    try {
      await fetch(`/api/whatsapp/session/${userId}/${sessionId}`, {
        method: 'DELETE',
      });
      setConnectionStatus('disconnected');
      setQrCode(null);
      setPairingCode(null);
    } catch (error) {
      console.error('Error disconnecting session:', error);
    }
  };

  const getStatusMessage = () => {
    switch (connectionStatus) {
      case 'connected':
        return '✅ WhatsApp Connected Successfully!';
      case 'waiting-scan':
        return '📱 Scan QR Code with WhatsApp';
      case 'waiting-pair':
        return '🔐 Enter pairing code in WhatsApp';
      case 'initializing':
        return '🔄 Initializing WhatsApp connection...';
      case 'disconnected':
        return '❌ WhatsApp Disconnected';
      default:
        return '⚪ Ready to connect';
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-600';
      case 'waiting-scan':
      case 'waiting-pair':
        return 'text-blue-600';
      case 'initializing':
        return 'text-yellow-600';
      case 'disconnected':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          WhatsApp Connection
        </h2>
        <p className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusMessage()}
        </p>
      </div>

      {connectionStatus === 'disconnected' && (
        <div className="text-center mb-6">
          <button
            onClick={initializeSession}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
          >
            {loading ? '🔄 Connecting...' : '📱 Connect WhatsApp'}
          </button>
        </div>
      )}

      {qrCode && (
        <div className="text-center mb-6">
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block mb-4">
            <QRCodeSVG value={qrCode} size={200} level="M" />
          </div>
          <p className="text-sm text-gray-600 mb-4">
            1. Open WhatsApp on your phone<br />
            2. Go to Settings → Linked Devices<br />
            3. Tap "Link a Device"<br />
            4. Scan this QR code
          </p>
          <div className="border-t pt-4">
            <p className="text-sm text-gray-500 mb-2">
              Prefer to use a pairing code instead?
            </p>
            <div className="flex gap-2">
              <input
                type="tel"
                placeholder="Phone number (e.g., +1234567890)"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
              />
              <button
                onClick={generatePairingCode}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded text-sm"
              >
                Get Code
              </button>
            </div>
          </div>
        </div>
      )}

      {pairingCode && (
        <div className="text-center mb-6">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-4">
            <div className="text-3xl font-mono font-bold text-blue-800 mb-2 tracking-widest">
              {pairingCode}
            </div>
            <p className="text-sm text-blue-600">
              Enter this code in WhatsApp
            </p>
          </div>
          <p className="text-sm text-gray-600">
            1. Open WhatsApp on your phone<br />
            2. Go to Settings → Linked Devices<br />
            3. Tap "Link a Device"<br />
            4. Choose "Link with phone number instead"<br />
            5. Enter the code above
          </p>
        </div>
      )}

      {connectionStatus === 'connected' && (
        <div className="text-center">
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-4">
            <div className="text-2xl mb-2">✅</div>
            <p className="text-green-800 font-medium">
              WhatsApp is connected and ready!
            </p>
            <p className="text-sm text-green-600 mt-2">
              Your bot is now active and can receive messages.
            </p>
          </div>
          <button
            onClick={disconnectSession}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-200"
          >
            Disconnect
          </button>
        </div>
      )}

      {(connectionStatus === 'waiting-scan' || connectionStatus === 'waiting-pair') && (
        <div className="text-center">
          <div className="animate-pulse">
            <div className="w-3 h-3 bg-blue-600 rounded-full mx-auto mb-2"></div>
          </div>
          <p className="text-sm text-gray-500">
            Waiting for connection...
          </p>
        </div>
      )}
    </div>
  );
};

export default WhatsAppQRCode;
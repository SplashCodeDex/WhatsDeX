import React, { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import io from 'socket.io-client';
import withAuth from '../../components/withAuth';

function AuthPage() {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [qrCode, setQrCode] = useState(null);
  const [pairingCode, setPairingCode] = useState(null);
  const [connectionProgress, setConnectionProgress] = useState(0);
  const [connectionTime, setConnectionTime] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [analytics, setAnalytics] = useState({});
  const [selectedMethod, setSelectedMethod] = useState('qr');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  const socketRef = useRef();
  const timerRef = useRef();
  const startTimeRef = useRef();

  const handleConnectionStatus = useCallback((status) => {
    setConnectionStatus(status.status);
    setRetryCount(status.retryCount || 0);

    if (status.status === 'connecting' && !startTimeRef.current) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setConnectionTime(Date.now() - startTimeRef.current);
      }, 1000);
    } else if (status.status === 'connected') {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }, []);

  const handleQRCode = useCallback((data) => {
    setQrCode(data);
    setError(null);
  }, []);

  const playVoiceCode = useCallback(async (voiceData) => {
    try {
      // In a real implementation, this would play the audio
      console.log('Playing voice code:', voiceData.text);
    } catch (err) {
      console.error('Failed to play voice code:', err);
    }
  }, []);

  const handlePairingCode = useCallback((data) => {
    setPairingCode(data);
    setError(null);

    // Auto-play voice if enabled
    if (voiceEnabled && data.voice) {
      playVoiceCode(data.voice);
    }
  }, [voiceEnabled, playVoiceCode]);

  const handleConnectionProgress = useCallback((progress) => {
    setConnectionProgress(progress);
  }, []);

  const handleAnalyticsUpdate = useCallback((data) => {
    setAnalytics(data);
  }, []);

  const handleError = useCallback((err) => {
    setError(err.message);
    setIsLoading(false);
  }, []);

  const startConnection = async () => {
    setIsLoading(true);
    setError(null);

    try {
      socketRef.current.emit('start_connection', {
        method: selectedMethod,
        voiceEnabled,
      });
    } catch (err) {
      setError('Failed to start connection process');
      setIsLoading(false);
    }
  };

  const stopConnection = () => {
    socketRef.current.emit('stop_connection');
    setIsLoading(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const refreshQR = () => {
    socketRef.current.emit('refresh_qr');
  };

  const refreshPairingCode = () => {
    socketRef.current.emit('refresh_pairing_code');
  };

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000');

    // Socket event listeners
    socketRef.current.on('connection_status', handleConnectionStatus);
    socketRef.current.on('qr_code', handleQRCode);
    socketRef.current.on('pairing_code', handlePairingCode);
    socketRef.current.on('connection_progress', handleConnectionProgress);
    socketRef.current.on('analytics_update', handleAnalyticsUpdate);
    socketRef.current.on('error', handleError);

    // Request initial status
    socketRef.current.emit('get_status');

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [handleConnectionStatus, handleQRCode, handlePairingCode, handleConnectionProgress, handleAnalyticsUpdate, handleError]);

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-100';
      case 'connecting': return 'text-blue-600 bg-blue-100';
      case 'disconnected': return 'text-red-600 bg-red-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected': return '✅';
      case 'connecting': return '🔄';
      case 'disconnected': return '❌';
      case 'error': return '⚠️';
      default: return '⏳';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Head>
        <title>Ultra-Smart WhatsApp Authentication</title>
        <meta name="description" content="Revolutionary WhatsApp bot authentication system" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🔐 Ultra-Smart WhatsApp Authentication
          </h1>
          <p className="text-lg text-gray-600">
            Revolutionary connection system with AI-powered intelligence
          </p>
        </div>

        {/* Connection Status Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-800">Connection Status</h2>
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(connectionStatus)}`}>
              {getStatusIcon(connectionStatus)} {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{formatTime(connectionTime)}</div>
              <div className="text-sm text-gray-500">Connection Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{retryCount}</div>
              <div className="text-sm text-gray-500">Retry Attempts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{connectionProgress}%</div>
              <div className="text-sm text-gray-500">Progress</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${connectionProgress}%` }}
            ></div>
          </div>

          {/* Control Buttons */}
          <div className="flex flex-wrap gap-3 justify-center">
            {connectionStatus === 'disconnected' && (
              <button
                onClick={startConnection}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                {isLoading ? '🔄 Starting...' : '🚀 Start Connection'}
              </button>
            )}

            {connectionStatus === 'connecting' && (
              <button
                onClick={stopConnection}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                🛑 Stop Connection
              </button>
            )}

            {connectionStatus === 'connected' && (
              <div className="text-center text-green-600 font-medium">
                ✅ Successfully Connected!
              </div>
            )}
          </div>
        </div>

        {/* Authentication Methods */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* QR Code Method */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">📱 QR Code</h3>
              <input
                type="radio"
                name="method"
                value="qr"
                checked={selectedMethod === 'qr'}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
            </div>

            {selectedMethod === 'qr' && qrCode && (
              <div className="text-center">
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <img
                    src={qrCode.qr}
                    alt="QR Code"
                    className="mx-auto max-w-full h-auto"
                  />
                </div>

                <div className="flex gap-2 justify-center mb-4">
                  <button
                    onClick={refreshQR}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    🔄 Refresh QR
                  </button>
                  <button
                    onClick={() => window.open(qrCode.qr, '_blank')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    📱 Open in App
                  </button>
                </div>

                <div className="text-sm text-gray-600">
                  <p>📱 Open WhatsApp on your phone</p>
                  <p>📷 Scan this QR code</p>
                  <p>⏰ Auto-refreshes every 45 seconds</p>
                </div>
              </div>
            )}

            {selectedMethod === 'qr' && !qrCode && (
              <div className="text-center text-gray-500 py-8">
                Select QR Code method and start connection to generate QR code
              </div>
            )}
          </div>

          {/* Pairing Code Method */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">🔢 Pairing Code</h3>
              <input
                type="radio"
                name="method"
                value="pairing"
                checked={selectedMethod === 'pairing'}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
            </div>

            {selectedMethod === 'pairing' && pairingCode && (
              <div className="text-center">
                <div className="bg-gray-50 p-6 rounded-lg mb-4">
                  <div className="text-3xl font-mono font-bold text-blue-600 mb-2">
                    {pairingCode.phonetic}
                  </div>
                  <div className="text-lg font-mono text-gray-600">
                    {pairingCode.alphanumeric}
                  </div>
                </div>

                <div className="flex gap-2 justify-center mb-4">
                  <button
                    onClick={refreshPairingCode}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    🔄 New Code
                  </button>
                  {pairingCode.voice && (
                    <button
                      onClick={() => playVoiceCode(pairingCode.voice)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      🔊 Play Voice
                    </button>
                  )}
                </div>

                <div className="text-sm text-gray-600">
                  <p>📱 Open WhatsApp on your phone</p>
                  <p>🔗 Go to Linked Devices</p>
                  <p>🔢 Enter the pairing code above</p>
                  <p>⏰ Code expires in 5 minutes</p>
                </div>
              </div>
            )}

            {selectedMethod === 'pairing' && !pairingCode && (
              <div className="text-center text-gray-500 py-8">
                Select Pairing Code method and start connection to generate code
              </div>
            )}
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">⚙️ Settings</h3>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="voice"
              checked={voiceEnabled}
              onChange={(e) => setVoiceEnabled(e.target.checked)}
              className="w-4 h-4 text-blue-600"
            />
            <label htmlFor="voice" className="text-gray-700">
              🔊 Enable voice guidance for pairing codes
            </label>
          </div>
        </div>

        {/* Analytics Dashboard */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">📊 Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {analytics.totalConnections || 0}
              </div>
              <div className="text-sm text-gray-500">Total Connections</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {analytics.successRate || 0}%
              </div>
              <div className="text-sm text-gray-500">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {analytics.averageTime || 0}s
              </div>
              <div className="text-sm text-gray-500">Avg Connection Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {analytics.activeQRs || 0}
              </div>
              <div className="text-sm text-gray-500">Active QR Codes</div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
            <div className="flex items-center">
              <div className="text-red-600 mr-2">⚠️</div>
              <div className="text-red-800">{error}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default withAuth(AuthPage);

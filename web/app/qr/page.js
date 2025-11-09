'use client';

import { useState, useEffect } from 'react';
import WhatsAppQRCode from '../../components/WhatsAppQRCode';

export default function QRCodePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-600 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-600">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              📱 WhatsDeX Bot Connection
            </h1>
            <p className="text-white/90 text-lg">
              Connect your WhatsApp to the WhatsDeX bot by scanning the QR code below
            </p>
          </div>

          {/* QR Code Component */}
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <WhatsAppQRCode 
              userId="admin" 
              sessionId="main-bot" 
            />
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
            <h3 className="text-xl font-semibold mb-4">📋 How to Connect:</h3>
            <ol className="space-y-2 text-white/90">
              <li>1. Open WhatsApp on your phone</li>
              <li>2. Tap Menu (⋮) → Linked Devices</li>
              <li>3. Tap "Link a Device"</li>
              <li>4. Scan the QR code above</li>
              <li>5. Your bot will be connected instantly!</li>
            </ol>
          </div>

          {/* Alternative Methods */}
          <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
            <h3 className="text-xl font-semibold mb-4">🔗 Alternative Access:</h3>
            <div className="space-y-2 text-sm text-white/80">
              <p>• <strong>API Endpoint:</strong> <code>/api/qr-code</code></p>
              <p>• <strong>PNG Image:</strong> <code>/api/qr-code?format=png</code></p>
              <p>• <strong>SVG Image:</strong> <code>/api/qr-code?format=svg</code></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
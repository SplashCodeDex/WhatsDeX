'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QrCode, Smartphone, CheckCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import WhatsAppQRCode from '@/components/WhatsAppQRCode';

export default function PairWhatsAppPage() {
  const [qrData, setQrData] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [botInstanceId, setBotInstanceId] = useState('');
  const router = useRouter();

  useEffect(() => {
    const botId = localStorage.getItem('botInstanceId');
    if (!botId) {
      router.push('/onboarding/create-bot');
      return;
    }
    setBotInstanceId(botId);
    
    // Generate QR code for pairing
    generateQRCode();
  }, [router]);

  const generateQRCode = async () => {
    if (!botInstanceId) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/qr-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          botInstanceId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate QR code');
      }

      const data = await response.json();
      setQrData(data.qr);
      setConnectionStatus('scanning');
      
      // Start polling for connection status
      pollConnectionStatus();
    } catch (error) {
      console.error('Error generating QR code:', error);
      setError('Failed to generate QR code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pollConnectionStatus = () => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/bots/${botInstanceId}/status`);
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'connected') {
            setConnectionStatus('connected');
            clearInterval(interval);
            
            // Wait a bit then redirect to completion
            setTimeout(() => {
              router.push('/onboarding/complete');
            }, 2000);
          }
        }
      } catch (error) {
        console.error('Error polling status:', error);
      }
    }, 3000);

    // Clear interval after 5 minutes
    setTimeout(() => clearInterval(interval), 300000);
  };

  const handleBack = () => {
    router.push('/onboarding/select-template');
  };

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'scanning':
        return <Badge className="bg-yellow-100 text-yellow-800">Waiting for scan</Badge>;
      case 'connected':
        return <Badge className="bg-green-100 text-green-800">Connected!</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Disconnected</Badge>;
    }
  };

  const getInstructions = () => {
    switch (connectionStatus) {
      case 'scanning':
        return [
          'Open WhatsApp on your phone',
          'Tap on the three dots (⋮) or Settings',
          'Select "Linked Devices"',
          'Tap "Link a Device"',
          'Scan the QR code below with your phone'
        ];
      case 'connected':
        return [
          'Successfully connected!',
          'Your WhatsApp account is now linked to your bot',
          'You can now start receiving and responding to messages',
          'Redirecting to completion...'
        ];
      default:
        return [
          'Click "Generate QR Code" to start the pairing process',
          'Make sure you have WhatsApp installed on your phone',
          'Ensure your phone has internet connection'
        ];
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-green-100 rounded-full">
              <Smartphone className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Connect WhatsApp
          </h1>
          <p className="text-gray-600">
            Link your WhatsApp account to activate your bot
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Instructions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <QrCode className="h-5 w-5" />
                  <span>Pairing Instructions</span>
                  {getStatusBadge()}
                </CardTitle>
                <CardDescription>
                  Follow these steps to link your WhatsApp account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3">
                  {getInstructions().map((instruction, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold ${
                        connectionStatus === 'connected' && index === 0 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        {connectionStatus === 'connected' && index === 0 ? 
                          <CheckCircle className="h-4 w-4" /> : 
                          index + 1
                        }
                      </div>
                      <span className={connectionStatus === 'connected' && index === 0 ? 'text-green-700 font-medium' : 'text-gray-700'}>
                        {instruction}
                      </span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <p className="text-red-800">{error}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* QR Code */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>QR Code</CardTitle>
                <CardDescription>
                  Scan this code with your WhatsApp
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                {connectionStatus === 'connected' ? (
                  <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <CheckCircle className="h-16 w-16 text-green-500" />
                    <p className="text-lg font-medium text-green-700">Successfully Connected!</p>
                    <p className="text-sm text-gray-600">Your bot is ready to use</p>
                  </div>
                ) : qrData ? (
                  <div className="space-y-4">
                    <WhatsAppQRCode qrData={qrData} />
                    <div className="text-center">
                      <Button
                        variant="outline"
                        onClick={generateQRCode}
                        disabled={loading}
                        className="flex items-center space-x-2"
                      >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        <span>Refresh QR Code</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <QrCode className="h-16 w-16 text-gray-400" />
                    <Button
                      onClick={generateQRCode}
                      disabled={loading}
                      className="flex items-center space-x-2"
                    >
                      {loading ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <QrCode className="h-4 w-4" />
                      )}
                      <span>{loading ? 'Generating...' : 'Generate QR Code'}</span>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-between mt-8 max-w-2xl mx-auto">
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex items-center"
            disabled={connectionStatus === 'connected'}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Templates
          </Button>
          
          {connectionStatus === 'connected' && (
            <Button
              onClick={() => router.push('/onboarding/complete')}
              className="flex items-center"
            >
              Continue to Dashboard
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
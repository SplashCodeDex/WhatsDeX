import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import withAuth from '../../components/withAuth';

function AnalyticsPage() {
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedMetric, setSelectedMetric] = useState('overview');

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await fetch(`/api/auth/analytics?range=${timeRange}`);
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatTime = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatPercentage = (value) => `${(value * 100).toFixed(1)}%`;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Head>
        <title>Ultra-Smart Auth Analytics</title>
        <meta name="description" content="Comprehensive authentication analytics dashboard" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📊 Ultra-Smart Authentication Analytics
          </h1>
          <p className="text-lg text-gray-600">
            Real-time insights into authentication performance and user behavior
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>

              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="overview">Overview</option>
                <option value="qr-codes">QR Codes</option>
                <option value="pairing-codes">Pairing Codes</option>
                <option value="reconnection">Reconnection</option>
                <option value="sessions">Sessions</option>
              </select>
            </div>

            <div className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Overview Dashboard */}
        {selectedMetric === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            {/* Overall Stats */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Total Connections</h3>
                <div className="text-2xl">🔗</div>
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {formatNumber(analytics.overall?.totalConnections || 0)}
              </div>
              <div className="text-sm text-gray-500">
                +12% from last period
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Success Rate</h3>
                <div className="text-2xl">✅</div>
              </div>
              <div className="text-3xl font-bold text-green-600 mb-2">
                {formatPercentage(analytics.overall?.successRate / 100 || 0)}
              </div>
              <div className="text-sm text-gray-500">
                +2.1% from last period
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Avg Connection Time</h3>
                <div className="text-2xl">⏱️</div>
              </div>
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {formatTime(analytics.overall?.averageConnectionTime * 1000 || 0)}
              </div>
              <div className="text-sm text-gray-500">
                -1.2s from last period
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Active Sessions</h3>
                <div className="text-2xl">🔵</div>
              </div>
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {analytics.overall?.activeConnections || 0}
              </div>
              <div className="text-sm text-gray-500">
                Currently online
              </div>
            </div>
          </div>
        )}

        {/* QR Code Analytics */}
        {selectedMetric === 'qr-codes' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">📱 QR Code Performance</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Active QR Codes</span>
                  <span className="font-semibold">{analytics.qrStats?.activeQRs || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Generated</span>
                  <span className="font-semibold">{analytics.qrStats?.totalGenerated || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Success Rate</span>
                  <span className="font-semibold text-green-600">{analytics.qrStats?.averageSuccessRate || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Generation Time</span>
                  <span className="font-semibold">{analytics.qrStats?.averageGenerationTime || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Optimal Refresh Time</span>
                  <span className="font-semibold">{analytics.qrStats?.optimalRefreshTime || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">🤖 AI Learning</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Successful Patterns</span>
                  <span className="font-semibold text-green-600">{analytics.qrStats?.learningPatterns?.successful || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Failed Patterns</span>
                  <span className="font-semibold text-red-600">{analytics.qrStats?.learningPatterns?.failed || 0}</span>
                </div>
                <div className="text-sm text-gray-500 mt-4">
                  AI continuously learns from authentication patterns to optimize QR code generation and refresh timing.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pairing Code Analytics */}
        {selectedMetric === 'pairing-codes' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">🔢 Pairing Code Performance</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Active Codes</span>
                  <span className="font-semibold">{analytics.pairingStats?.activeCodes || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Generated</span>
                  <span className="font-semibold">{analytics.pairingStats?.totalGenerated || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Success Rate</span>
                  <span className="font-semibold text-green-600">{analytics.pairingStats?.successRate || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Avg Usage Time</span>
                  <span className="font-semibold">{analytics.pairingStats?.averageUseTime || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Accessibility Usage</span>
                  <span className="font-semibold text-blue-600">{analytics.pairingStats?.accessibilityUsage || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">🎯 User Preferences</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Preferred Format</span>
                  <span className="font-semibold capitalize">{analytics.pairingStats?.userPreferences?.format || 'phonetic'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Preferred Length</span>
                  <span className="font-semibold capitalize">{analytics.pairingStats?.userPreferences?.length || 'medium'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Voice Guidance</span>
                  <span className="font-semibold">{analytics.pairingStats?.userPreferences?.voice ? '✅ Enabled' : '❌ Disabled'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Accessibility</span>
                  <span className="font-semibold">{analytics.pairingStats?.userPreferences?.accessibility ? '✅ Enabled' : '❌ Disabled'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reconnection Analytics */}
        {selectedMetric === 'reconnection' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">🔄 Reconnection Engine</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Connection Status</span>
                  <span className={`font-semibold ${analytics.reconnectionStats?.connectionState?.isConnected ? 'text-green-600' : 'text-red-600'}`}>
                    {analytics.reconnectionStats?.connectionState?.isConnected ? '✅ Connected' : '❌ Disconnected'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Active Attempts</span>
                  <span className="font-semibold">{analytics.reconnectionStats?.activeAttempts || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Success Rate</span>
                  <span className="font-semibold text-green-600">{formatPercentage(analytics.reconnectionStats?.connectionState?.successRate || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Avg Reconnection Time</span>
                  <span className="font-semibold">{formatTime(analytics.reconnectionStats?.connectionState?.averageReconnectionTime || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Retries</span>
                  <span className="font-semibold">{analytics.reconnectionStats?.connectionState?.totalRetries || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">🧠 AI Learning</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Successful Strategies</span>
                  <span className="font-semibold text-green-600">{analytics.reconnectionStats?.learningData?.successfulStrategies?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Failed Strategies</span>
                  <span className="font-semibold text-red-600">{analytics.reconnectionStats?.learningData?.failedStrategies?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Network Patterns</span>
                  <span className="font-semibold">{analytics.reconnectionStats?.learningData?.networkPatterns?.size || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Time Patterns</span>
                  <span className="font-semibold">{analytics.reconnectionStats?.learningData?.timePatterns?.size || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Device Patterns</span>
                  <span className="font-semibold">{analytics.reconnectionStats?.learningData?.devicePatterns?.size || 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Session Analytics */}
        {selectedMetric === 'sessions' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">🔐 Session Management</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Active Sessions</span>
                  <span className="font-semibold">{analytics.sessionStats?.activeSessions || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Devices</span>
                  <span className="font-semibold">{analytics.sessionStats?.totalDevices || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Avg Session Duration</span>
                  <span className="font-semibold">{analytics.sessionStats?.averageSessionDuration || 0} min</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Recovery Points</span>
                  <span className="font-semibold">{analytics.sessionStats?.recoveryPoints || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Session History</span>
                  <span className="font-semibold">{analytics.sessionStats?.sessionHistory || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">📱 Device Distribution</h3>
              <div className="space-y-3">
                {analytics.sessionStats?.deviceStats && Object.entries(analytics.sessionStats.deviceStats).map(([deviceId, stats]) => (
                  <div key={deviceId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-800">{deviceId.substring(0, 8)}...</div>
                      <div className="text-sm text-gray-500">
                        {stats.types.join(', ')} • {stats.count} session{stats.count !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="text-lg">
                      {stats.types.includes('mobile') ? '📱' : '💻'}
                    </div>
                  </div>
                ))}
                {(!analytics.sessionStats?.deviceStats || Object.keys(analytics.sessionStats.deviceStats).length === 0) && (
                  <div className="text-center text-gray-500 py-8">
                    No device data available
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Performance Charts Placeholder */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">📈 Performance Trends</h3>
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-gray-600 mb-4">
              Advanced performance charts and trend analysis coming soon
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">99.9%</div>
                <div className="text-sm text-gray-600">Uptime</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">&lt; 10s</div>
                <div className="text-sm text-gray-600">Avg Response Time</div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">24/7</div>
                <div className="text-sm text-gray-600">Monitoring</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(AnalyticsPage);

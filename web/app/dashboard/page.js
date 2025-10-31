'use client';

import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState({
    activeUsers: 0,
    messagesToday: 0,
    avgResponseTime: 0,
    uptime: 0,
    totalCommands: 0,
    errorRate: 0
  });

  const [commandStats, setCommandStats] = useState([]);
  const [userActivity, setUserActivity] = useState([]);
  const [systemHealth, setSystemHealth] = useState({});
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Initialize Socket.IO connection
    const socketConnection = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      transports: ['websocket', 'polling']
    });

    socketConnection.on('connect', () => {
      console.log('Connected to dashboard socket');
      socketConnection.emit('subscribe:metrics');
    });

    socketConnection.on('metrics:update', (data) => {
      setMetrics(data);
    });

    socketConnection.on('command:stats', (data) => {
      setCommandStats(data);
    });

    socketConnection.on('user:activity', (data) => {
      setUserActivity(prev => [data, ...prev.slice(0, 49)]); // Keep last 50 entries
    });

    socketConnection.on('system:health', (data) => {
      setSystemHealth(data);
    });

    setSocket(socketConnection);

    // Fetch initial data
    fetchInitialData();

    return () => {
      socketConnection.disconnect();
    };
  }, []);

  const fetchInitialData = async () => {
    try {
      const [metricsRes, commandsRes, healthRes] = await Promise.all([
        fetch('/api/metrics'),
        fetch('/api/commands/stats'),
        fetch('/api/health')
      ]);

      if (metricsRes.ok) setMetrics(await metricsRes.json());
      if (commandsRes.ok) setCommandStats(await commandsRes.json());
      if (healthRes.ok) setSystemHealth(await healthRes.json());
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
    }
  };

  const formatUptime = (uptime) => {
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatResponseTime = (ms) => {
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          WhatsDeX Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Real-time monitoring and analytics for your WhatsApp bot
        </p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Badge variant="secondary">Live</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Currently online
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Today</CardTitle>
            <Badge variant="secondary">24h</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.messagesToday.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total messages processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Badge variant={metrics.avgResponseTime < 500 ? "default" : "destructive"}>
              {metrics.avgResponseTime < 500 ? "Good" : "Slow"}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatResponseTime(metrics.avgResponseTime)}</div>
            <p className="text-xs text-muted-foreground">
              Command execution time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Badge variant="outline">99.9%</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatUptime(metrics.uptime)}</div>
            <p className="text-xs text-muted-foreground">
              Continuous operation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="commands">Commands</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Message Volume (Last 24h)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={userActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="messages" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Time Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { range: '<100ms', count: 45 },
                    { range: '100-500ms', count: 32 },
                    { range: '500-1000ms', count: 15 },
                    { range: '1-2s', count: 6 },
                    { range: '>2s', count: 2 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="commands" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Command Usage Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={commandStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="command" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="usage" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Activity Heatmap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground">
                User activity visualization coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Database</span>
                  <Badge variant={systemHealth.database === 'healthy' ? 'default' : 'destructive'}>
                    {systemHealth.database || 'unknown'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Redis Cache</span>
                  <Badge variant={systemHealth.redis === 'healthy' ? 'default' : 'destructive'}>
                    {systemHealth.redis || 'unknown'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>WhatsApp Connection</span>
                  <Badge variant={systemHealth.whatsapp === 'connected' ? 'default' : 'destructive'}>
                    {systemHealth.whatsapp || 'unknown'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>AI Service</span>
                  <Badge variant={systemHealth.gemini === 'healthy' ? 'default' : 'destructive'}>
                    {systemHealth.gemini || 'unknown'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Memory Usage</span>
                  <span className="font-mono">{systemHealth.memoryUsage || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>CPU Usage</span>
                  <span className="font-mono">{systemHealth.cpuUsage || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Cache Hit Rate</span>
                  <span className="font-mono">{systemHealth.cacheHitRate || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Error Rate</span>
                  <span className="font-mono">{systemHealth.errorRate || 'N/A'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
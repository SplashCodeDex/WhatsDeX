'use client';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/common/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Bot, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Settings, 
  CreditCard,
  Plus,
  QrCode,
  Play,
  Square,
  RefreshCw
} from 'lucide-react';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [bots, setBots] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load bots (cookie-based auth)
      const botsResponse = await fetch('/api/bots');
      if (botsResponse.status === 401) {
        window.location.href = '/login';
        return;
      }
      const botsData = await botsResponse.json();

      // Load subscription
      const subResponse = await fetch('/api/subscription');
      const subData = await subResponse.json();

      if (botsData.success) {
        setBots(botsData.data.bots);
        setTenant({
          ...subData.data.tenant,
          limits: botsData.data.limits,
          plan: botsData.data.plan
        });
      }

      if (subData.success) {
        setSubscription(subData.data);
      }

      // Derive a display name from tenant or fallback
      const displayName = subData?.data?.tenant?.name || 'User';
      setUser({ name: displayName });

      setLoading(false);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setLoading(false);
    }
  };

  const createBot = async () => {
    try {
      const response = await fetch('/api/bots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': (document.cookie.match(/(?:^|; )csrf_token=([^;]+)/)?.[1] ? decodeURIComponent(document.cookie.match(/(?:^|; )csrf_token=([^;]+)/)[1]) : '')
        },
        body: JSON.stringify({
          name: `Bot ${bots.length + 1}`,
          config: {
            welcomeMessage: 'Hello! How can I help you today?',
            aiEnabled: true
          }
        })
      });

      const data = await response.json();
      if (data.success) {
        await loadDashboardData();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Failed to create bot:', error);
      alert('Failed to create bot');
    }
  };

  const getBotStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'scanning': return 'bg-blue-500';
      case 'disconnected': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getBotStatusText = (status) => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting';
      case 'scanning': return 'Scanning QR';
      case 'disconnected': return 'Disconnected';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  const showBotQRCode = (botId) => {
    const bot = bots.find(b => b.id === botId);
    if (bot && bot.qrCode) {
      // Open QR code in modal or new window
      window.open(`data:image/png;base64,${bot.qrCode}`, '_blank');
    } else {
      // Request new QR code generation
      alert('Generating QR code for bot connection...');
      // TODO: Implement QR code generation API call
    }
  };

  const openBotSettings = (botId) => {
    // Navigate to bot settings page
    window.location.href = `/dashboard/bots/${botId}/settings`;
  };

  const openBillingManagement = () => {
    // Navigate to billing management page
    window.location.href = '/dashboard/billing';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const usage = subscription?.usage || {};
  const limits = tenant?.limits || {};

  return (
    <Layout title="Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">
              Welcome back, {user?.name}! Manage your WhatsApp bots and analytics.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="px-3 py-1">
              {tenant?.plan?.toUpperCase()} Plan
            </Badge>
            <Button onClick={() => window.location.href = '/settings'}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Bots</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {bots.filter(bot => bot.status === 'connected').length}
              </div>
              <p className="text-xs text-muted-foreground">
                {bots.length} total bots
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messages Today</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usage.messages || 0}</div>
              <p className="text-xs text-muted-foreground">
                {limits.maxMessages === -1 ? 'Unlimited' : `${limits.maxMessages} limit`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usage.users || 0}</div>
              <p className="text-xs text-muted-foreground">
                {limits.maxUsers === -1 ? 'Unlimited' : `${limits.maxUsers} limit`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Growth</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+12%</div>
              <p className="text-xs text-muted-foreground">vs last month</p>
            </CardContent>
          </Card>
        </div>

        {/* Plan Usage */}
        {tenant?.plan !== 'enterprise' && (
          <Card>
            <CardHeader>
              <CardTitle>Plan Usage</CardTitle>
              <CardDescription>
                Monitor your current usage against plan limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Bots ({usage.bots || 0}/{limits.maxBots})</span>
                  <span>{Math.round(((usage.bots || 0) / limits.maxBots) * 100)}%</span>
                </div>
                <Progress value={((usage.bots || 0) / limits.maxBots) * 100} />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Messages ({usage.messages || 0}/{limits.maxMessages})</span>
                  <span>{Math.round(((usage.messages || 0) / limits.maxMessages) * 100)}%</span>
                </div>
                <Progress value={((usage.messages || 0) / limits.maxMessages) * 100} />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Team Members ({usage.users || 0}/{limits.maxUsers})</span>
                  <span>{Math.round(((usage.users || 0) / limits.maxUsers) * 100)}%</span>
                </div>
                <Progress value={((usage.users || 0) / limits.maxUsers) * 100} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Tabs defaultValue="bots" className="space-y-6">
          <TabsList>
            <TabsTrigger value="bots">Bot Instances</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          <TabsContent value="bots" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">WhatsApp Bots</h2>
              <Button onClick={createBot} disabled={usage.bots >= limits.maxBots && limits.maxBots !== -1}>
                <Plus className="h-4 w-4 mr-2" />
                Create Bot
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bots.map((bot) => (
                <Card key={bot.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{bot.name}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${getBotStatusColor(bot.status)}`}></div>
                        <Badge variant="outline">
                          {getBotStatusText(bot.status)}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription>
                      {bot.phoneNumber || 'No phone number'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-gray-600">
                      <p>Last Activity: {bot.lastActivity ? new Date(bot.lastActivity).toLocaleString() : 'Never'}</p>
                      <p>Created: {new Date(bot.createdAt).toLocaleDateString()}</p>
                    </div>

                    {bot.status === 'scanning' && bot.qrCode && (
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">Scan QR Code with WhatsApp</p>
                        <img src={bot.qrCode} alt="QR Code" className="mx-auto max-w-[200px]" />
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => showBotQRCode(bot.id)}
                      >
                        <QrCode className="h-4 w-4 mr-2" />
                        QR Code
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => openBotSettings(bot.id)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Config
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {bots.length === 0 && (
                <Card className="col-span-full">
                  <CardContent className="text-center py-12">
                    <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No bots yet</h3>
                    <p className="text-gray-600 mb-4">
                      Create your first WhatsApp bot to get started
                    </p>
                    <Button onClick={createBot}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Bot
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Dashboard</CardTitle>
                <CardDescription>
                  Coming soon - Detailed analytics and insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Analytics features are being developed</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle>Billing & Subscription</CardTitle>
                <CardDescription>
                  Manage your subscription and view billing history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{subscription?.currentPlan?.name} Plan</h3>
                      <p className="text-sm text-gray-600">
                        ${(subscription?.currentPlan?.price || 0) / 100}/month
                      </p>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={() => openBillingManagement()}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Manage
                    </Button>
                  </div>
                  
                  {subscription?.subscription && (
                    <div className="text-sm text-gray-600">
                      <p>Status: {subscription.subscription.status}</p>
                      <p>Next billing: {new Date(subscription.subscription.currentPeriodEnd).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
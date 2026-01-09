
import { WebSocket, WebSocketServer } from 'ws';
import logger from '../utils/logger.js';
import { db } from '../lib/firebase.js';
import { Timestamp } from 'firebase-admin/firestore';

interface AnalyticsMetrics {
  activeUsers: number;
  totalCommands: number;
  aiRequests: number;
  responseTime: number;
  errorRate: number;
  uptime: number;
  timestamp?: string;
  errorsPerMinute?: number;
}

class AnalyticsService {
  private wss: WebSocketServer | null;
  private clients: Set<WebSocket>;
  private isInitialized: boolean;
  private cache: Map<string, { data: any; timestamp: number }>;
  private cacheTimeout: number;
  private metrics: AnalyticsMetrics;

  constructor() {
    this.wss = null;
    this.clients = new Set();
    this.isInitialized = false;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000;
    this.metrics = {
      activeUsers: 0,
      totalCommands: 0,
      aiRequests: 0,
      responseTime: 0,
      errorRate: 0,
      uptime: 0,
      errorsPerMinute: 0,
    };
    logger.info('Analytics service initialized');
  }

  async initialize(config: { websocketPort?: number }) {
    try {
      if (config.websocketPort) {
        this.wss = new WebSocketServer({ port: config.websocketPort });
        this.wss.on('connection', async (ws: WebSocket) => {
          this.clients.add(ws);
          ws.on('message', (message: any) => this.handleWebSocketMessage(ws, message));
          ws.on('close', () => this.clients.delete(ws));
          this.sendToClient(ws, { type: 'welcome', data: await this.getDashboardData() });
        });
        logger.info(`WebSocket server started on port ${config.websocketPort}`);
      }
      this.startMetricsCollection();
      this.isInitialized = true;
      logger.info('Analytics service initialized successfully');
    } catch (error: any) {
      logger.error('Failed to initialize analytics service', { error: error.message });
      throw error;
    }
  }

  async handleWebSocketMessage(ws: any, message: any) {
    try {
      const data = JSON.parse(message.toString());
      switch (data.type) {
        case 'subscribe':
          this.sendToClient(ws, { type: 'subscribed', data: { message: 'Subscribed' } });
          break;
        case 'get_metrics':
          this.sendToClient(ws, { type: 'metrics', data: await this.getMetrics(data.timeframe) });
          break;
        case 'get_dashboard':
          this.sendToClient(ws, { type: 'dashboard', data: await this.getDashboardData() });
          break;
        default: break;
      }
    } catch (error: any) { logger.error('WebSocket message error', error); }
  }

  sendToClient(ws: any, data: any) {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data));
  }

  broadcast(data: any) {
    const message = JSON.stringify(data);
    this.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) ws.send(message);
    });
  }

  startMetricsCollection() {
    setInterval(async () => {
      try {
        await this.updateMetrics();
        const dashboardData = await this.getDashboardData();
        this.broadcast({ type: 'dashboard_update', data: dashboardData, timestamp: new Date().toISOString() });
      } catch (error: any) { logger.error('Metrics update failed', error); }
    }, 30000);
    setInterval(() => this.cache.clear(), 10 * 60 * 1000);
  }

  async updateMetrics() {
    try {
      const now = new Date();
      const oneHourAgo = Timestamp.fromMillis(Date.now() - 60 * 60 * 1000);
      const oneDayAgo = Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000);

      const activeUsers = (await db.collection('users').where('lastActivity', '>=', oneHourAgo).count().get()).data().count;
      const totalCommands = (await db.collection('command_usage').where('usedAt', '>=', oneDayAgo).count().get()).data().count;
      const aiRequests = (await db.collection('command_usage').where('usedAt', '>=', oneDayAgo).where('category', '==', 'ai-chat').count().get()).data().count;

      const errors = (await db.collection('command_usage').where('usedAt', '>=', oneDayAgo).where('success', '==', false).count().get()).data().count;

      this.metrics = {
        activeUsers,
        totalCommands,
        aiRequests,
        responseTime: 0, // Need aggregation for avg, skip for now
        errorRate: totalCommands > 0 ? (errors / totalCommands) * 100 : 0,
        uptime: process.uptime(),
        timestamp: now.toISOString(),
      };
    } catch (error: any) { logger.error('Failed to update metrics', error); }
  }

  async getDashboardData() {
    const cacheKey = 'dashboard_data';
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey)!.data;

    const totalUsers = (await db.collection('users').count().get()).data().count;
    const premiumUsers = (await db.collection('subscriptions').where('status', '==', 'active').count().get()).data().count;

    // Recent Activity
    const recentSnapshot = await db.collection('command_usage').orderBy('usedAt', 'desc').limit(10).get();
    const recentActivity = await Promise.all(recentSnapshot.docs.map(async doc => {
      const d = doc.data();
      let userName = 'Unknown';
      if (d.userId) {
        const u = await db.collection('users').doc(d.userId).get();
        if (u.exists) userName = u.data()?.name || 'Unknown';
      }
      return {
        id: doc.id,
        user: userName,
        command: d.command,
        category: d.category,
        success: d.success,
        timestamp: d.usedAt instanceof Timestamp ? d.usedAt.toDate() : new Date()
      };
    }));

    const data = {
      overview: {
        totalUsers,
        premiumUsers,
        activeUsers: this.metrics.activeUsers,
        totalCommands: this.metrics.totalCommands,
        aiRequests: this.metrics.aiRequests,
        revenue: 0 // Implement revenue aggregation if needed
      },
      performance: {
        responseTime: this.metrics.responseTime,
        errorRate: this.metrics.errorRate,
        uptime: this.metrics.uptime
      },
      commandStats: {}, // detailed stats omitted
      recentActivity,
      systemHealth: { uptime: process.uptime(), memory: process.memoryUsage() },
      timestamp: new Date().toISOString()
    };

    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  }

  async getMetrics(timeframe = '24h') {
    // Simplified mock or limited data fetch
    return { timeframe, summary: { message: "Detailed metrics not implemented in Firestore yet" } };
  }

  async trackEvent(userId: string, event: string, properties: any = {}) {
    try {
      await db.collection('analytics').add({
        metric: `event_${event}`,
        value: 1,
        category: 'behavior',
        metadata: JSON.stringify({ userId, event, ...properties }),
        recordedAt: Timestamp.now()
      });
      this.broadcast({ type: 'event', data: { userId, event, properties, timestamp: new Date().toISOString() } });
    } catch (error: any) { logger.error('Failed to track event', error); }
  }

  // Create method for generic analytics (used by mediaProcessor)
  async create(data: { data: any }) {
    // Wrapper to match Prisma signature mostly used by mediaProcessor
    // Input: { data: { metric, value, category, metadata } }
    try {
      await db.collection('analytics').add({
        ...data.data,
        recordedAt: Timestamp.now()
      });
    } catch (e) { logger.error('Failed to create analytics entry', e); }
  }
}

export default new AnalyticsService();

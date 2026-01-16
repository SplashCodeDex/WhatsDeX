
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
  private clients: Map<string, Set<WebSocket>>; // Grouped by tenantId
  private isInitialized: boolean;
  private cache: Map<string, { data: any; timestamp: number }>;
  private metrics: Map<string, AnalyticsMetrics>; // Per tenant

  constructor() {
    this.wss = null;
    this.clients = new Map();
    this.isInitialized = false;
    this.cache = new Map();
    this.metrics = new Map();
    logger.info('Analytics service initialized');
  }

  async initialize(config: { websocketPort?: number }) {
    try {
      if (config.websocketPort) {
        this.wss = new WebSocketServer({ port: config.websocketPort });
        this.wss.on('connection', async (ws: WebSocket, req) => {
          // Identify tenant from URL or header (e.g., /?tenantId=XXX)
          const url = new URL(req.url || '', `http://${req.headers.host}`);
          const tenantId = url.searchParams.get('tenantId');

          if (!tenantId) {
            ws.close(1008, 'Tenant ID Required');
            return;
          }

          if (!this.clients.has(tenantId)) this.clients.set(tenantId, new Set());
          this.clients.get(tenantId)!.add(ws);

          ws.on('close', () => {
            this.clients.get(tenantId)?.delete(ws);
            if (this.clients.get(tenantId)?.size === 0) this.clients.delete(tenantId);
          });

          this.sendToClient(ws, { type: 'welcome', data: await this.getDashboardData(tenantId) });
        });
        logger.info(`WebSocket server started on port ${config.websocketPort}`);
      }
      this.startMetricsCollection();
      this.isInitialized = true;
    } catch (error: any) {
      logger.error('Failed to initialize analytics service', error);
      throw error;
    }
  }

  async broadcastToTenant(tenantId: string, data: any) {
    const message = JSON.stringify(data);
    this.clients.get(tenantId)?.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) ws.send(message);
    });
  }

  startMetricsCollection() {
    setInterval(async () => {
      // Collect metrics for active tenants
      for (const tenantId of this.clients.keys()) {
        try {
          await this.updateTenantMetrics(tenantId);
          const dash = await this.getDashboardData(tenantId);
          this.broadcastToTenant(tenantId, { type: 'dashboard_update', data: dash });
        } catch (e) { logger.error(`Metrics failed for ${tenantId}`, e); }
      }
    }, 30000);
  }

  async updateTenantMetrics(tenantId: string) {
    const oneDayAgo = Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000);
    const tenantPath = `tenants/${tenantId}`;

    // Workspace-isolated queries
    const commandCount = (await db.collection(`${tenantPath}/command_usage`).where('usedAt', '>=', oneDayAgo).count().get()).data().count;
    const aiCount = (await db.collection(`${tenantPath}/command_usage`).where('category', '==', 'ai-chat').count().get()).data().count;
    const errorCount = (await db.collection(`${tenantPath}/command_usage`).where('success', '==', false).count().get()).data().count;

    this.metrics.set(tenantId, {
      activeUsers: 0, // Implement per-tenant activity tracking in next step
      totalCommands: commandCount,
      aiRequests: aiCount,
      responseTime: 0,
      errorRate: commandCount > 0 ? (errorCount / commandCount) * 100 : 0,
      uptime: process.uptime(),
    });
  }

  async getDashboardData(tenantId: string) {
    const tenantMetrics = this.metrics.get(tenantId);
    const tenantPath = `tenants/${tenantId}`;

    // Recent Activity for this tenant only
    const recentSnapshot = await db.collection(`${tenantPath}/command_usage`).orderBy('usedAt', 'desc').limit(10).get();
    const recentActivity = recentSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: (doc.data().usedAt as Timestamp).toDate()
    }));

    return {
      overview: { ...tenantMetrics },
      recentActivity,
      timestamp: new Date().toISOString()
    };
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
      // Broadcast to all tenants? Not safe without tenant context.
      // For now, we skip broadcasting generic events unless we know the tenant.
    } catch (error: any) { logger.error('Failed to track event', error); }
  }

  private sendToClient(ws: WebSocket, message: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
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

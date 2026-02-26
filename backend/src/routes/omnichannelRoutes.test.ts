import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import omnichannelRoutes from './omnichannelRoutes.js';

// Mock dependencies
const mockGetAllBots = vi.fn();
vi.mock('../archive/multiTenantBotService.js', () => ({
  default: {
    getAllBots: (...args: any[]) => mockGetAllBots(...args)
  }
}));

vi.mock('../services/channels/ChannelManager.js', () => ({
  channelManager: {
    getAdapter: vi.fn()
  }
}));

describe('Omnichannel Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    // Simulate auth middleware
    app.use((req: any, _res, next) => {
      req.user = { tenantId: 'tenant-123' };
      next();
    });
    app.use('/api/omnichannel', omnichannelRoutes);
  });

  describe('GET /api/omnichannel/status', () => {
    it('should return system status', async () => {
      mockGetAllBots.mockResolvedValue({
        success: true,
        data: []
      });

      const response = await request(app).get('/api/omnichannel/status');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('gatewayInitialized');
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import omnichannelRoutes from './omnichannelRoutes.js';

// Mock dependencies
const mockGetAllBots = vi.fn();
vi.mock('../services/multiTenantBotService.js', () => ({
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
    it('should return list of channels with status', async () => {
      mockGetAllBots.mockResolvedValue({
        success: true,
        data: [
          { id: 'bot-1', name: 'WA Bot', type: 'whatsapp', status: 'connected', phoneNumber: '+123' }
        ]
      });

      const response = await request(app).get('/api/omnichannel/status');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].type).toBe('whatsapp');
    });
  });
});

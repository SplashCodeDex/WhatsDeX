import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import router from './multiTenant.js';
import { agentService } from '../services/AgentService.js';
import { channelService } from '../services/ChannelService.js';

// Mock dependencies
vi.mock('../services/multiTenantService.js', () => ({
  default: {
    getAgents: vi.fn().mockResolvedValue({ success: true, data: [] })
  }
}));

vi.mock('../services/AgentService.js', () => ({
  agentService: {
    createAgent: vi.fn(),
    deleteAgent: vi.fn()
  }
}));

vi.mock('../services/ChannelService.js', () => {
  const mock = {
    createChannel: vi.fn(),
    getChannelsForAgent: vi.fn(),
    getChannel: vi.fn(),
    updateChannel: vi.fn(),
    deleteChannel: vi.fn()
  };
  return {
    channelService: mock,
    default: mock
  };
});

vi.mock('../archive/multiTenantBotService.js', () => ({
  default: {
    startBot: vi.fn(),
    stopBot: vi.fn(),
    hasActiveBot: vi.fn(),
    getBotQR: vi.fn()
  }
}));

// Mock middleware
const app = express();
app.use(express.json());
app.use((req, res, next) => {
  req.user = { tenantId: 'tenant-123' };
  next();
});
app.use('/api', router);

describe('MultiTenant Hierarchical Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should list agents: GET /api/agents', async () => {
    const response = await request(app).get('/api/agents');
    expect(response.status).toBe(200);
  });

  it('should create a channel under an agent: POST /api/agents/:agentId/channels', async () => {
    vi.mocked(channelService.createChannel).mockResolvedValue({ success: true, data: { id: 'chan-1' } as any });
    
    const response = await request(app)
      .post('/api/agents/agent-1/channels')
      .send({ name: 'New Channel' });

    expect(response.status).toBe(200);
    expect(channelService.createChannel).toHaveBeenCalledWith('tenant-123', expect.anything(), 'agent-1');
  });

  it('should get a channel using hierarchical path: GET /api/agents/:agentId/channels/:id', async () => {
    vi.mocked(channelService.getChannel).mockResolvedValue({ success: true, data: { id: 'chan-1' } as any });

    const response = await request(app).get('/api/agents/agent-1/channels/chan-1');

    expect(response.status).toBe(200);
    expect(channelService.getChannel).toHaveBeenCalledWith('tenant-123', 'chan-1', 'agent-1');
  });

  it('should get a channel using legacy path: GET /api/bots/:botId', async () => {
    vi.mocked(channelService.getChannel).mockResolvedValue({ success: true, data: { id: 'chan-1' } as any });

    const response = await request(app).get('/api/bots/chan-1');

    expect(response.status).toBe(200);
    expect(channelService.getChannel).toHaveBeenCalledWith('tenant-123', 'chan-1', 'system_default');
  });
});

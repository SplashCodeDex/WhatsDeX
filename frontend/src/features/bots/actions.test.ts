import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBot, updateBot, deleteBot, connectBot, disconnectBot } from './actions';
import { api } from '@/lib/api';

// Mock dependencies
vi.mock('@/lib/api', () => ({
  api: {
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    get: vi.fn(),
  },
  API_ENDPOINTS: {
    OMNICHANNEL: {
        AGENTS: {
            CHANNELS: {
                CREATE: (agentId: string) => `/api/internal/agents/${agentId}/channels` as const,
                UPDATE: (agentId: string, id: string) => `/api/internal/agents/${agentId}/channels/${id}` as const,
                DELETE: (agentId: string, id: string) => `/api/internal/agents/${agentId}/channels/${id}` as const,
                CONNECT: (agentId: string, id: string) => `/api/internal/agents/${agentId}/channels/${id}/connect` as const,
                DISCONNECT: (agentId: string, id: string) => `/api/internal/agents/${agentId}/channels/${id}/disconnect` as const,
            }
        }
    },
    BOTS: {
      CREATE: '/api/internal/bots',
      UPDATE: (id: string) => `/api/internal/bots/${id}`,
      DELETE: (id: string) => `/api/internal/bots/${id}`,
      CONNECT: (id: string) => `/api/internal/bots/${id}/connect`,
      DISCONNECT: (id: string) => `/api/internal/bots/${id}/disconnect`,
    },
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Bot Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createBot', () => {
    it('should create a bot successfully and return result', async () => {
      const mockBot = { id: '123', name: 'Test Bot' };
      (api.post as any).mockResolvedValue({ success: true, data: mockBot });

      const formData = new FormData();
      formData.append('name', 'Test Bot');
      formData.append('agentId', 'system_default');

      const result = await createBot(null, formData);

      expect(api.post).toHaveBeenCalledWith('/api/internal/agents/system_default/channels', expect.objectContaining({ name: 'Test Bot' }));
      expect(result).toEqual({ success: true, data: mockBot });
    });

    it('should return error when validation fails', async () => {
      const formData = new FormData();
      // Name is required

      const result = await createBot(null, formData);

      expect(api.post).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      if (!result.success) {
          expect(result.error.code).toBe('validation_error');
      }
    });
  });

  describe('updateBot', () => {
    it('should update a bot successfully', async () => {
      const mockBot = { id: '123', name: 'Updated Bot' };
      (api.patch as any).mockResolvedValue({ success: true, data: mockBot });

      const formData = new FormData();
      formData.append('data', JSON.stringify({ name: 'Updated Bot' }));

      const result = await updateBot('123', 'system_default', null, formData);

      expect(api.patch).toHaveBeenCalledWith('/api/internal/agents/system_default/channels/123', expect.objectContaining({ name: 'Updated Bot' }));
      expect(result).toEqual({ success: true, data: mockBot });
    });

    it('should fail with invalid json', async () => {
        const formData = new FormData();
        formData.append('data', '{ invalid json');
  
        const result = await updateBot('123', 'system_default', null, formData);
  
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.message).toContain('Invalid JSON');
        }
      });
  });

  describe('deleteBot', () => {
    it('should delete a bot successfully', async () => {
      (api.delete as any).mockResolvedValue({ success: true, data: null });
      
      const formData = new FormData();
      const result = await deleteBot('123', 'system_default', null, formData);

      expect(api.delete).toHaveBeenCalledWith('/api/internal/agents/system_default/channels/123');
      expect(result).toEqual({ success: true, data: null });
    });
  });

  describe('connectBot', () => {
    it('should connect a bot successfully', async () => {
      (api.post as any).mockResolvedValue({ success: true, data: null });

      const formData = new FormData();
      const result = await connectBot('123', 'system_default', null, formData);

      expect(api.post).toHaveBeenCalledWith('/api/internal/agents/system_default/channels/123/connect');
      expect(result).toEqual({ success: true, data: null });
    });
  });

  describe('disconnectBot', () => {
      it('should disconnect a bot successfully', async () => {
        (api.post as any).mockResolvedValue({ success: true, data: null });
  
        const formData = new FormData();
        const result = await disconnectBot('123', 'system_default', null, formData);
  
        expect(api.post).toHaveBeenCalledWith('/api/internal/agents/system_default/channels/123/disconnect');
        expect(result).toEqual({ success: true, data: null });
      });
    });
});

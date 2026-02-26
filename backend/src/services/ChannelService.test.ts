import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChannelService } from './ChannelService.js';
import { firebaseService } from '@/services/FirebaseService.js';
import { multiTenantService } from '@/services/multiTenantService.js';

// Mock dependencies
vi.mock('@/services/FirebaseService.js', () => ({
  firebaseService: {
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    getCollection: vi.fn(),
    deleteDoc: vi.fn()
  }
}));

vi.mock('@/services/multiTenantService.js', () => ({
  multiTenantService: {
    canAddBot: vi.fn()
  }
}));

describe('ChannelService', () => {
  let service: ChannelService;
  const tenantId = 'tenant-123';

  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-ignore - access private instance for test reset
    ChannelService.instance = undefined;
    service = ChannelService.getInstance();
  });

  describe('createChannel', () => {
    it('should create a new channel when limit is not exceeded', async () => {
      vi.mocked(multiTenantService.canAddBot).mockResolvedValue({ success: true, data: true });
      vi.mocked(firebaseService.setDoc).mockResolvedValue(undefined);

      const result = await service.createChannel(tenantId, { name: 'Test Channel', type: 'whatsapp' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Test Channel');
        expect(result.data.id).toMatch(/^chan_/);
        expect(firebaseService.setDoc).toHaveBeenCalledWith('channels', result.data.id, expect.any(Object), tenantId);
      }
    });

    it('should fail when channel limit is exceeded', async () => {
      vi.mocked(multiTenantService.canAddBot).mockResolvedValue({ success: true, data: false });

      const result = await service.createChannel(tenantId, { name: 'Test Channel' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Channel limit exceeded for your current plan.');
      }
    });
  });

  describe('getChannel', () => {
    it('should return channel data when it exists', async () => {
      const mockChannel = { id: 'chan-1', name: 'Existing' };
      vi.mocked(firebaseService.getDoc).mockResolvedValue(mockChannel);

      const result = await service.getChannel(tenantId, 'chan-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockChannel);
      }
    });

    it('should return error when channel does not exist', async () => {
      vi.mocked(firebaseService.getDoc).mockResolvedValue(null);

      const result = await service.getChannel(tenantId, 'non-existent');

      expect(result.success).toBe(false);
    });
  });

  describe('deleteChannel', () => {
    it('should delete channel document', async () => {
      vi.mocked(firebaseService.deleteDoc).mockResolvedValue(undefined);

      const result = await service.deleteChannel(tenantId, 'chan-1');

      expect(result.success).toBe(true);
      expect(firebaseService.deleteDoc).toHaveBeenCalledWith('channels', 'chan-1', tenantId);
    });
  });
});

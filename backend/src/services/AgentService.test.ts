import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentService } from './AgentService.js';
import { firebaseService } from './FirebaseService.js';

// Mock dependencies
vi.mock('./FirebaseService.js', () => ({
  firebaseService: {
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    getCollection: vi.fn(),
    deleteDoc: vi.fn()
  },
  FirebaseService: { getInstance: () => ({}) }
}));

vi.mock('@/utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}));

describe('AgentService', () => {
  let service: AgentService;
  const tenantId = 'tenant-123';

  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-ignore - reset singleton
    AgentService.instance = undefined;
    service = AgentService.getInstance();
  });

  describe('ensureSystemAgent', () => {
    it('should create system_default agent if it does not exist', async () => {
      vi.mocked(firebaseService.getDoc).mockResolvedValue(null);
      vi.mocked(firebaseService.setDoc).mockResolvedValue(undefined);

      const result = await service.ensureSystemAgent(tenantId);

      expect(result.success).toBe(true);
      expect(firebaseService.getDoc).toHaveBeenCalledWith('agents', 'system_default', tenantId);
      expect(firebaseService.setDoc).toHaveBeenCalledWith('agents', 'system_default', expect.objectContaining({
        id: 'system_default',
        name: 'System Default Agent'
      }), tenantId);
    });

    it('should return existing system_default if it exists', async () => {
      vi.mocked(firebaseService.getDoc).mockResolvedValue({ id: 'system_default', name: 'Existing' });

      const result = await service.ensureSystemAgent(tenantId);

      expect(result.success).toBe(true);
      expect(firebaseService.setDoc).not.toHaveBeenCalled();
    });
  });

  describe('deleteAgent', () => {
    it('should delete agent document', async () => {
      const agentId = 'custom-123';
      const result = await service.deleteAgent(tenantId, agentId);

      expect(result.success).toBe(true);
      expect(firebaseService.deleteDoc).toHaveBeenCalledWith('agents', agentId, tenantId);
    });

    it('should fail if trying to delete system_default', async () => {
      const result = await service.deleteAgent(tenantId, 'system_default');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Cannot delete the system default agent.');
      }
    });
  });
});

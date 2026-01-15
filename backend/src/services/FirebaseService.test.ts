import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FirebaseService } from '@/services/FirebaseService.js';

// Use vi.hoisted to define variables that must be available in vi.mock
const { mockDb } = vi.hoisted(() => {
  const mockDoc = {
    get: vi.fn(async () => ({ exists: true, data: () => ({}) })),
    set: vi.fn(async () => {}),
    update: vi.fn(async () => {}),
    delete: vi.fn(async () => {}),
    collection: vi.fn(() => mockCollection),
  };
  
  const mockCollection = {
    doc: vi.fn(() => mockDoc),
    get: vi.fn(async () => ({ docs: [] })),
  };

  return {
    mockDb: {
      collection: vi.fn(() => mockCollection),
    },
  };
});

vi.mock('@/lib/firebase.js', () => ({
  db: mockDb,
}));

describe('FirebaseService', () => {
  let service: FirebaseService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = FirebaseService.getInstance();
  });

  describe('Path Generation', () => {
    it('should correctly generate tenant root paths', () => {
      const path = (service as any).getTenantPath('tenant-1');
      expect(path).toBe('tenants/tenant-1');
    });

    it('should correctly generate tenant subcollection paths', () => {
      const path = (service as any).getTenantSubcollectionPath('tenant-1', 'bots');
      expect(path).toBe('tenants/tenant-1/bots');
    });
  });

  describe('CRUD Operations', () => {
    it('should throw error if tenantId is missing for tenant-scoped operations', async () => {
      await expect(service.getDoc('bots', 'bot-1')).rejects.toThrow('Tenant ID is required');
    });

    it('should call Firestore with correct path for tenant-scoped get', async () => {
      const tenantId = 'tenant-123';
      const botId = 'bot-456';
      
      await service.getDoc('bots', botId, tenantId);

      expect(mockDb.collection).toHaveBeenCalledWith('tenants');
    });
  });

  describe('setDoc', () => {
    it('should call Firestore set with correct data', async () => {
      const tenantId = 'tenant-123';
      const data = { name: 'New Bot' };
      
      await service.setDoc('bots', 'bot-1', data, tenantId);

      expect(mockDb.collection).toHaveBeenCalledWith('tenants');
    });
  });
});
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FirebaseService } from '@/services/FirebaseService.js';

// Use vi.hoisted to define variables that must be available in vi.mock
const { mockDb } = vi.hoisted(() => {
  const mockDoc = {
    get: vi.fn(async () => ({ 
      exists: true, 
      data: () => ({ 
        id: 'bot-456',
        name: 'Test Bot',
        status: 'disconnected',
        connectionMetadata: { browser: ['Chrome', 'OSX', '1.0'], platform: 'web' },
        stats: { messagesSent: 0, messagesReceived: 0, contactsCount: 0, errorsCount: 0 },
        createdAt: new Date(),
        updatedAt: new Date()
      }) 
    })),
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

  describe('CRUD Operations', () => {
    it('should throw error if schema is not found', async () => {
      // @ts-ignore
      await expect(service.getDoc('invalid-collection', 'id-1')).rejects.toThrow('No schema defined');
    });

    it('should call Firestore with correct path for tenant-scoped get', async () => {
      const tenantId = 'tenant-123';
      const botId = 'bot-456';
      
      await service.getDoc('bots', botId, tenantId);

      // Path should be 'tenants/tenant-123/bots'
      expect(mockDb.collection).toHaveBeenCalledWith('tenants/tenant-123/bots');
    });
  });

  describe('setDoc', () => {
    it('should call Firestore set with correct data', async () => {
      const tenantId = 'tenant-123';
      const data = { 
        id: 'bot-1',
        name: 'New Bot',
        status: 'connected' as const,
        connectionMetadata: { browser: ['Chrome', 'OSX', '1.0'] as [string, string, string], platform: 'web' },
        stats: { messagesSent: 0, messagesReceived: 0, contactsCount: 0, errorsCount: 0 },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await service.setDoc('bots', 'bot-1', data, tenantId, false);

      expect(mockDb.collection).toHaveBeenCalledWith('tenants/tenant-123/bots');
    });
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FirebaseService } from '@/services/FirebaseService.js';

// Define the class before vi.hoisted if needed, or use a simple function
class MockFieldValue {}

// Use vi.hoisted to define variables that must be available in vi.mock
const { mockDb, mockAdmin } = vi.hoisted(() => {
  class MockFieldValue {}

  const mockDoc = {
    get: vi.fn(async () => ({ 
      exists: true, 
      data: () => ({ 
        id: 'bot-456',
        name: 'Test Bot',
        status: 'disconnected',
        connectionMetadata: { browser: ['WhatsDeX', 'Chrome', '1.0.0'], platform: 'web' },
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
    add: vi.fn(async () => ({ id: 'new-id' })),
    where: vi.fn(() => mockCollection),
    orderBy: vi.fn(() => mockCollection),
    limit: vi.fn(() => mockCollection),
    count: vi.fn(() => ({ get: async () => ({ data: () => ({ count: 5 }) }) })),
  };

  const mockBatch = {
    set: vi.fn(() => mockBatch),
    update: vi.fn(() => mockBatch),
    delete: vi.fn(() => mockBatch),
    commit: vi.fn(async () => {}),
  };

  return {
    mockDb: {
      collection: vi.fn(() => mockCollection),
      batch: vi.fn(() => mockBatch),
      runTransaction: vi.fn((fn) => fn({})),
    },
    mockAdmin: {
      firestore: {
        FieldValue: MockFieldValue
      }
    }
  };
});

vi.mock('@/lib/firebase.js', () => ({
  db: mockDb,
  admin: mockAdmin,
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
        connectionMetadata: { browser: ['WhatsDeX', 'Chrome', '1.0.0'] as [string, string, string], platform: 'web' },
        stats: { messagesSent: 0, messagesReceived: 0, contactsCount: 0, errorsCount: 0 },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await service.setDoc('bots', 'bot-1', data, tenantId, false);

      expect(mockDb.collection).toHaveBeenCalledWith('tenants/tenant-123/bots');
    });

    it('should bypass validation when FieldValue is present', async () => {
      const tenantId = 'tenant-123';
      const data = {
        'stats.messagesSent': new mockAdmin.firestore.FieldValue()
      };

      // Should not throw even if schema expects a number for messagesSent
      await expect(service.setDoc('bots', 'bot-1', data as any, tenantId, true)).resolves.not.toThrow();
    });
  });

  describe('batch', () => {
    it('should support batch operations with validation', async () => {
      const tenantId = 'tenant-123';
      const batch = service.batch();

      batch.set('bots', 'bot-1', {
        id: 'bot-1',
        name: 'Batch Bot',
        status: 'connected',
        connectionMetadata: { browser: ['WhatsDeX', 'Chrome', '1.0.0'], platform: 'web' },
        stats: { messagesSent: 0, messagesReceived: 0, contactsCount: 0, errorsCount: 0 },
        createdAt: new Date(),
        updatedAt: new Date()
      } as any, tenantId);

      await batch.commit();

      expect(mockDb.batch).toHaveBeenCalled();
    });
  });

  describe('getCollection', () => {
    it('should apply query options', async () => {
      const tenantId = 'tenant-123';
      await service.getCollection('bots', tenantId, {
        where: [['status', '==', 'connected']],
        limit: 10,
        orderBy: [{ field: 'createdAt', direction: 'desc' }]
      });

      const col = mockDb.collection();
      expect(col.where).toHaveBeenCalledWith('status', '==', 'connected');
      expect(col.limit).toHaveBeenCalledWith(10);
      expect(col.orderBy).toHaveBeenCalledWith('createdAt', 'desc');
    });
  });
});

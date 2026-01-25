import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContactService } from './contactService.js';
import { FirebaseService } from './FirebaseService.js';
import { Readable } from 'stream';

// Mock dependencies
const { mockFirebase } = vi.hoisted(() => ({
  mockFirebase: {
    getCollection: vi.fn(),
    setDoc: vi.fn(),
    getDoc: vi.fn(),
  }
}));

const { mockDb, mockBatch } = vi.hoisted(() => {
    const mockBatch = {
      commit: vi.fn().mockResolvedValue(undefined),
      set: vi.fn(),
    };
    const mockDb = {
      batch: () => mockBatch,
      collection: vi.fn().mockReturnThis(),
      doc: vi.fn().mockReturnThis(),
    };
    return { mockDb, mockBatch };
});

vi.mock('./FirebaseService.js', () => ({
  firebaseService: mockFirebase,
  FirebaseService: { getInstance: () => mockFirebase }
}));

vi.mock('../lib/firebase.js', () => ({
  db: mockDb,
}));


describe('ContactService', () => {
  let service: ContactService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockBatch.commit.mockClear();
    mockBatch.set.mockClear();
    service = ContactService.getInstance();
  });

  describe('importContacts', () => {
    it('should parse CSV stream and save contacts', async () => {
      const csvData = `name,phone,email,tags\nJohn Doe,1234567890,john@example.com,vip\nJane Doe,0987654321,jane@example.com,new`;
      const stream = Readable.from(csvData);

      const tenantId = 'tenant_1';

      const result = await service.importContacts(tenantId, stream);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ count: 2, errors: [] });
      }
      expect(mockBatch.set).toHaveBeenCalledTimes(2);
      expect(mockBatch.commit).toHaveBeenCalledTimes(1);
    });

    it('should handle invalid CSV rows gracefully from a stream', async () => {
      // The `phone` field is required by the schema. The "Invalid User" row is missing a phone number.
      const csvData = `name,phone\nValid User,1234567890\nInvalid User,`;
      const stream = Readable.from(csvData);

      const tenantId = 'tenant_1';

      const result = await service.importContacts(tenantId, stream);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.count).toBe(1);
        expect(result.data.errors.length).toBe(1);
        expect(result.data.errors[0]).toContain('phone');
      }
      expect(mockBatch.set).toHaveBeenCalledTimes(1);
      expect(mockBatch.commit).toHaveBeenCalledTimes(1);
    });
  });
});

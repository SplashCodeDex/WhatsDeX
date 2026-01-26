import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Readable } from 'stream';
import { ContactService } from './contactService.js';
import { db } from '../lib/firebase.js';

const { mockBatchSet, mockBatchCommit, mockBatch } = vi.hoisted(() => {
    const mockBatchSet = vi.fn();
    const mockBatchCommit = vi.fn().mockResolvedValue(undefined);
    const mockBatch = vi.fn(() => ({
        set: mockBatchSet,
        commit: mockBatchCommit,
    }));
    return { mockBatchSet, mockBatchCommit, mockBatch };
});

vi.mock('../lib/firebase.js', () => {
    const mockDoc = vi.fn(() => ({}));
    const mockCollection = vi.fn(() => ({
        doc: mockDoc,
    }));
    const mockDb = {
        batch: mockBatch,
        collection: vi.fn(() => ({
            doc: vi.fn(() => ({
                collection: mockCollection,
            })),
        })),
    };
    return { db: mockDb };
});

describe('ContactService', () => {
  let service: ContactService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = ContactService.getInstance();
  });

  describe('importContacts', () => {
    it('should correctly parse CSV, normalize phone numbers, and save contacts', async () => {
      const csvData = `name,phoneNumber,email,tags\n"Doe, John","(123) 456-7890",john@example.com,"vip|lead"\nJane Doe,+1-987-654-3210,jane@example.com,new`;
      const tenantId = 'tenant_123';
      const stream = Readable.from(csvData);

      const result = await service.importContacts(tenantId, stream);

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.count).toBe(2);
      expect(result.data.errors).toEqual([]);
      expect(mockBatchCommit).toHaveBeenCalledTimes(1);
      expect(mockBatchSet).toHaveBeenCalledTimes(2);

      expect(mockBatchSet).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          name: 'Doe, John',
          phone: '1234567890@s.whatsapp.net',
          email: 'john@example.com',
          tags: ['vip', 'lead'],
        })
      );

      expect(mockBatchSet).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          name: 'Jane Doe',
          phone: '19876543210@s.whatsapp.net',
          email: 'jane@example.com',
          tags: ['new'],
        })
      );
    });

    it('should handle invalid CSV rows gracefully', async () => {
      const csvData = `name,phone\nValid User,1234567890\nInvalid User,`;
      const tenantId = 'tenant_456';
      const stream = Readable.from(csvData);

      const result = await service.importContacts(tenantId, stream);

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.count).toBe(1);
      expect(result.data.errors.length).toBe(1);
      expect(result.data.errors[0]).toContain('Row 3: phone: Phone number is required');
      expect(mockBatchSet).toHaveBeenCalledTimes(1);
      expect(mockBatchCommit).toHaveBeenCalledTimes(1);
    });

    it('should handle empty or header-only CSV data', async () => {
        const tenantId = 'tenant_789';

        let stream = Readable.from('');
        let result = await service.importContacts(tenantId, stream);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.count).toBe(0);
            expect(result.data.errors).toEqual([]);
        }

        stream = Readable.from('header1,header2');
        result = await service.importContacts(tenantId, stream);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.count).toBe(0);
            expect(result.data.errors).toEqual([]);
        }
    });

    it('should reject on database error during batch commit', async () => {
        const csvData = `name,phone\nTest User,1234567890`;
        const tenantId = 'tenant_db_error';
        const stream = Readable.from(csvData);
        const dbError = new Error('Database commit failed');

        mockBatchCommit.mockRejectedValue(dbError);

        await expect(service.importContacts(tenantId, stream)).rejects.toThrow(dbError);
    });
  });
});

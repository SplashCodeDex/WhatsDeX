import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ContactService } from './contactService.js';
import { db } from '../lib/firebase.js';
import { firebaseService } from './FirebaseService.js';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const { mockBatchSet, mockBatchCommit, mockBatch } = vi.hoisted(() => {
    const mockBatchSet = vi.fn();
    const mockBatchCommit = vi.fn().mockResolvedValue(undefined);
    const mockBatch = vi.fn(() => ({
        set: mockBatchSet,
        commit: mockBatchCommit,
    }));
    return { mockBatchSet, mockBatchCommit, mockBatch };
});

vi.mock('./FirebaseService.js', () => ({
    firebaseService: {
        getCollection: vi.fn(),
    }
}));

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
  const testFilePath = path.join(process.cwd(), 'test-contacts.csv');

  beforeEach(() => {
    vi.clearAllMocks();
    service = ContactService.getInstance();
  });

  afterEach(async () => {
    if (existsSync(testFilePath)) {
      await fs.unlink(testFilePath).catch(() => {});
    }
  });

  describe('importContacts', () => {
    it('should correctly parse CSV, normalize phone numbers, and save contacts', async () => {
      const csvData = `name,phoneNumber,email,tags\n"Doe, John","(123) 456-7890",john@example.com,"vip|lead"\nJane Doe,+1-987-654-3210,jane@example.com,new`;
      await fs.writeFile(testFilePath, csvData);
      const tenantId = 'tenant_123';

      const result = await service.importContacts(tenantId, testFilePath);

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
      await fs.writeFile(testFilePath, csvData);
      const tenantId = 'tenant_456';

      const result = await service.importContacts(tenantId, testFilePath);

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.count).toBe(1);
      expect(result.data.errors.length).toBe(1);
      expect(result.data.errors[0]).toContain('Row 3: phone: Phone number is required');
      expect(mockBatchSet).toHaveBeenCalledTimes(1);
      expect(mockBatchCommit).toHaveBeenCalledTimes(1);
    });

    it('should return an error for empty or invalid CSV data', async () => {
      const tenantId = 'tenant_789';

      await fs.writeFile(testFilePath, '');
      let result = await service.importContacts(tenantId, testFilePath);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe("CSV contains no data rows");
      }

      await fs.writeFile(testFilePath, 'header1,header2');
      result = await service.importContacts(tenantId, testFilePath);
      expect(result.success).toBe(false);
       if (!result.success) {
        expect(result.error.message).toBe("CSV contains no data rows");
      }
    });
  });

  describe('getAudience', () => {
    it('should fetch audiences from the correct collection', async () => {
      const tenantId = 'tenant_123';
      const mockAudiences = [{ id: 'aud_1', name: 'VIPs' }];
      vi.mocked(firebaseService.getCollection).mockResolvedValue(mockAudiences);

      const result = await service.getAudience(tenantId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockAudiences);
      }
      expect(firebaseService.getCollection).toHaveBeenCalledWith('audiences', tenantId);
    });
  });
});

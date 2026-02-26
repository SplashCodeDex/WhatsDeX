import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContactService } from './contactService.js';
import { Readable } from 'stream';
import fs from 'fs';

const { mockBatchSet, mockBatchUpdate, mockBatchCommit, mockBatch } = vi.hoisted(() => {
    const mockBatchSet = vi.fn();
    const mockBatchUpdate = vi.fn();
    const mockBatchCommit = vi.fn().mockResolvedValue(undefined);
    const mockBatch = vi.fn(() => ({
        set: mockBatchSet,
        update: mockBatchUpdate,
        commit: mockBatchCommit,
    }));
    return { mockBatchSet, mockBatchUpdate, mockBatchCommit, mockBatch };
});

vi.mock('./FirebaseService.js', () => ({
    firebaseService: {
        batch: mockBatch,
        getCollection: vi.fn().mockResolvedValue([{ id: 'bot_1' }]),
        setDoc: vi.fn().mockResolvedValue(undefined),
        updateDoc: vi.fn().mockResolvedValue(undefined),
    }
}));

// Mock the 'fs' module
vi.mock('fs', () => ({
    default: {
        createReadStream: vi.fn(),
    }
}));


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
      const mockStream = Readable.from(csvData);
      vi.mocked(fs.createReadStream).mockReturnValue(mockStream as any);

      const { firebaseService } = await import('./FirebaseService.js');

      const result = await service.importContacts(tenantId, 'dummy_path.csv');

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.count).toBe(2);
      expect(result.data.errors).toEqual([]);
      expect(mockBatchCommit).toHaveBeenCalledTimes(2); // One for contacts, one for stats
      expect(mockBatchSet).toHaveBeenCalledTimes(2);

      expect(mockBatchSet).toHaveBeenCalledWith(
        'contacts',
        expect.stringMatching(/^cont_/),
        expect.objectContaining({
          name: 'Doe, John',
          phone: '1234567890@s.whatsapp.net',
          email: 'john@example.com',
          tags: ['vip', 'lead'],
        }),
        tenantId
      );

      expect(mockBatchSet).toHaveBeenCalledWith(
        'contacts',
        expect.stringMatching(/^cont_/),
        expect.objectContaining({
          name: 'Jane Doe',
          phone: '19876543210@s.whatsapp.net',
          email: 'jane@example.com',
          tags: ['new'],
        }),
        tenantId
      );

      // Verify bot stats update
      expect(firebaseService.getCollection).toHaveBeenCalledWith('bots', tenantId);
      expect(mockBatchUpdate).toHaveBeenCalledWith(
          'bots',
          'bot_1',
          expect.objectContaining({ 'stats.contactsCount': expect.anything() }),
          tenantId
      );
    });

    it('should handle invalid CSV rows gracefully', async () => {
      const csvData = `name,phone\nValid User,1234567890\nInvalid User,`;
      const tenantId = 'tenant_456';
      const mockStream = Readable.from(csvData);
      vi.mocked(fs.createReadStream).mockReturnValue(mockStream as any);

      const result = await service.importContacts(tenantId, 'dummy_path.csv');

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.count).toBe(1);
      expect(result.data.errors.length).toBe(1);
      expect(result.data.errors[0]).toContain('Row 3: phone: Phone number is required');
      expect(mockBatchSet).toHaveBeenCalledTimes(1);
      expect(mockBatchCommit).toHaveBeenCalledTimes(2); // One for contacts, one for stats
    });

    it('should return an error for empty or invalid CSV data', async () => {
      const tenantId = 'tenant_789';

      // Empty CSV
      let mockStream = Readable.from('');
      vi.mocked(fs.createReadStream).mockReturnValue(mockStream as any);
      let result = await service.importContacts(tenantId, 'dummy_path.csv');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe("CSV contains no data rows");
      }

      // CSV with only headers
      mockStream = Readable.from('header1,header2');
      vi.mocked(fs.createReadStream).mockReturnValue(mockStream as any);
      result = await service.importContacts(tenantId, 'dummy_path.csv');
      expect(result.success).toBe(false);
       if (!result.success) {
        expect(result.error.message).toBe("CSV contains no data rows");
      }
    });
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContactService } from './contactService.js';
import { Readable } from 'stream';
import fs from 'fs';

vi.mock('../lib/firebase.js', () => ({
    db: {
        batch: vi.fn(),
        collection: vi.fn(() => ({
            doc: vi.fn(() => ({
                collection: vi.fn(() => ({
                    doc: vi.fn(() => ({})), // Return a mock doc reference
                })),
            })),
        })),
    }
}));

vi.mock('./FirebaseService.js', () => ({
    firebaseService: {
        getCollection: vi.fn().mockResolvedValue([{ id: 'bot_1' }]),
        getCollectionWithQuery: vi.fn().mockResolvedValue([{ id: 'bot_1' }]),
        setDoc: vi.fn().mockResolvedValue(undefined),
        batch: vi.fn(() => ({
            set: vi.fn(),
            commit: vi.fn().mockResolvedValue(undefined),
        })),
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

      const batchMock = (firebaseService.batch as any).mock.results[0].value;
      expect(batchMock.commit).toHaveBeenCalledTimes(1);
      expect(batchMock.set).toHaveBeenCalledTimes(2);

      expect(batchMock.set).toHaveBeenCalledWith(
        'contacts',
        expect.any(String),
        expect.objectContaining({
          name: 'Doe, John',
          phone: '1234567890@s.whatsapp.net',
          email: 'john@example.com',
          tags: ['vip', 'lead'],
        }),
        tenantId,
        false
      );

      expect(batchMock.set).toHaveBeenCalledWith(
        'contacts',
        expect.any(String),
        expect.objectContaining({
          name: 'Jane Doe',
          phone: '19876543210@s.whatsapp.net',
          email: 'jane@example.com',
          tags: ['new'],
        }),
        tenantId,
        false
      );

      // Verify bot stats update
      expect(firebaseService.getCollection).toHaveBeenCalledWith('bots', tenantId);
      expect(firebaseService.setDoc).toHaveBeenCalledWith(
          'bots',
          'bot_1',
          expect.objectContaining({ 'stats.contactsCount': expect.anything() }),
          tenantId,
          true
      );
    });

    it('should handle invalid CSV rows gracefully', async () => {
      const csvData = `name,phone\nValid User,1234567890\nInvalid User,`;
      const tenantId = 'tenant_456';
      const mockStream = Readable.from(csvData);
      vi.mocked(fs.createReadStream).mockReturnValue(mockStream as any);

      const { firebaseService } = await import('./FirebaseService.js');

      const result = await service.importContacts(tenantId, 'dummy_path.csv');

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.count).toBe(1);
      expect(result.data.errors.length).toBe(1);
      expect(result.data.errors[0]).toContain('Row 3: phone: Phone number is required');

      const batchMock = (firebaseService.batch as any).mock.results[0].value;
      expect(batchMock.set).toHaveBeenCalledTimes(1);
      expect(batchMock.commit).toHaveBeenCalledTimes(1);
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

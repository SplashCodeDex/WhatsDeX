import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContactService } from './contactService.js';
import { FirebaseService } from './FirebaseService.js';

// Mock dependencies
const { mockFirebase } = vi.hoisted(() => ({
  mockFirebase: {
    getCollection: vi.fn(),
    setDoc: vi.fn(),
    getDoc: vi.fn(),
  }
}));

vi.mock('./FirebaseService.js', () => ({
  firebaseService: mockFirebase,
  FirebaseService: { getInstance: () => mockFirebase }
}));

describe('ContactService', () => {
  let service: ContactService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = ContactService.getInstance();
  });

  describe('importContacts', () => {
    it('should parse CSV and save contacts', async () => {
      const csvData = `name,phone,email,tags
John Doe,1234567890,john@example.com,vip
Jane Doe,0987654321,jane@example.com,new`;
      
      const tenantId = 'tenant_1';
      
      mockFirebase.setDoc.mockResolvedValue(undefined);

      const result = await service.importContacts(tenantId, csvData);

      expect(result.success).toBe(true);
      if (result.success) {
          expect(result.data).toEqual({ count: 2, errors: [] });
      }
      expect(mockFirebase.setDoc).toHaveBeenCalledTimes(2);
      expect(mockFirebase.setDoc).toHaveBeenCalledWith(
        'contacts',
        expect.any(String),
        expect.objectContaining({
            name: 'John Doe',
            phone: '1234567890',
            tags: ['vip']
        }),
        tenantId
      );
    });

    it('should handle invalid CSV rows gracefully', async () => {
         const csvData = `name,phone
Valid User,1234567890
Invalid User,`; // Missing phone
      
      const tenantId = 'tenant_1';
      mockFirebase.setDoc.mockResolvedValue(undefined);

      const result = await service.importContacts(tenantId, csvData);

      expect(result.success).toBe(true);
      if (result.success) {
          expect(result.data.count).toBe(1); 
          expect(result.data.errors.length).toBe(1);
      }
    });
  });
});

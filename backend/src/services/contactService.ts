import { firebaseService } from './FirebaseService.js';
import { ContactSchema, Result } from '../types/contracts.js';
import logger from '../utils/logger.js';
import crypto from 'crypto';

export class ContactService {
  private static instance: ContactService;

  private constructor() {}

  public static getInstance(): ContactService {
    if (!ContactService.instance) {
      ContactService.instance = new ContactService();
    }
    return ContactService.instance;
  }

  public async importContacts(
    tenantId: string,
    csvData: string
  ): Promise<Result<{ count: number; errors: string[] }>> {
    try {
        const rows = csvData.split(/\r?\n/).filter(line => line.trim() !== '');
        if (rows.length < 2) {
             return { success: false, error: new Error("CSV is empty or missing headers") };
        }

        const headers = rows[0].split(',').map(h => h.trim());
        const contacts = rows.slice(1);
        const errors: string[] = [];
        let count = 0;

        await Promise.all(contacts.map(async (rowStr, index) => {
            const values = rowStr.split(',').map(v => v.trim()); 
            // Basic CSV parsing constraint: Doesn't handle commas inside quotes.
            
            const rawData: any = {};
            // If values are missing at the end, they are undefined.
            headers.forEach((header, i) => {
                rawData[header] = values[i] || '';
            });
            
            // Map common fields to schema
            const contactData = {
                id: `cont_${crypto.randomUUID()}`,
                tenantId,
                name: rawData.name || rawData.fullName || 'Unknown',
                phone: rawData.phone || rawData.phoneNumber || '',
                email: rawData.email || '',
                tags: rawData.tags ? rawData.tags.split('|').map((t: string) => t.trim()) : [],
                attributes: rawData,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const validation = ContactSchema.safeParse(contactData);
            if (!validation.success) {
                const msg = validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
                errors.push(`Row ${index + 2}: ${msg}`);
                return;
            }

            try {
                await firebaseService.setDoc('tenants/{tenantId}/contacts', contactData.id, contactData, tenantId);
                count++;
            } catch (e: any) {
                errors.push(`Row ${index + 2}: Save failed - ${e.message}`);
            }
        }));

        return { success: true, data: { count, errors } };

    } catch (error: any) {
      logger.error('Error importing contacts', error);
      return { success: false, error };
    }
  }

  public async getAudience(tenantId: string): Promise<Result<any[]>> {
      // Implementation pending
      return { success: true, data: [] };
  }
}
import { db } from '../lib/firebase.js';
import { firebaseService } from './FirebaseService.js';
import { ContactSchema, Result } from '../types/contracts.js';
import logger from '../utils/logger.js';
import crypto from 'crypto';
import { parse } from 'csv-parse/sync';

const normalizePhoneNumber = (phone: string): string => {
  let digits = phone.replace(/\D/g, '');
  if (digits.includes('@')) {
    return digits;
  }
  return `${digits}@s.whatsapp.net`;
}

export class ContactService {
  private static instance: ContactService;

  private constructor() { }

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
      if (!csvData || csvData.trim() === '') {
        return { success: false, error: new Error("CSV data is empty") };
      }

      const records = parse(csvData, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      if (records.length === 0) {
        return { success: false, error: new Error("CSV contains no data rows") };
      }

      const errors: string[] = [];
      let count = 0;

      const BATCH_SIZE = 500;
      for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = db.batch();
        const chunk = records.slice(i, i + BATCH_SIZE);

        chunk.forEach((record: any, chunkIndex: number) => {
          const index = i + chunkIndex;

          const rawData: any = record;
          const phone = rawData.phone || rawData.phoneNumber || '';

          const contactData = {
            id: `cont_${crypto.randomUUID()}`,
            tenantId,
            name: rawData.name || rawData.fullName || 'Unknown',
            phone: phone ? normalizePhoneNumber(phone) : '',
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
          } else {
            const contactRef = db.collection('tenants')
              .doc(tenantId)
              .collection('contacts')
              .doc(contactData.id);
            batch.set(contactRef, validation.data);
            count++;
          }
        });

        await batch.commit();
      }

      return { success: true, data: { count, errors } };

    } catch (error: any) {
      logger.error('Error importing contacts', error);
      if (error.code === 'CSV_INVALID_COLUMN_NAME') {
          return { success: false, error: new Error('Invalid CSV headers. Please check for duplicates.')};
      }
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  public async getAudience(tenantId: string): Promise<Result<any[]>> {
    try {
      // Simple implementation: Fetch all contacts for now
      // In a real scenario, this would apply filters or fetch from 'audiences' collection
      const contacts = await firebaseService.getCollection('tenants/{tenantId}/contacts' as any, tenantId);
      return { success: true, data: contacts };
    } catch (error: any) {
      logger.error('Error fetching audience', error);
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }
}

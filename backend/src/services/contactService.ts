import { db } from '../lib/firebase.js';
import { firebaseService } from './FirebaseService.js';
import { ContactSchema, Result } from '../types/contracts.js';
import logger from '../utils/logger.js';
import crypto from 'crypto';
import { parse } from 'csv-parse';
import fs from 'fs';

const normalizePhoneNumber = (phone: string): string => {
  if (phone.includes('@s.whatsapp.net') || phone.includes('@g.us')) {
    return phone;
  }
  const digits = phone.replace(/\D/g, '');
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
    filePath: string
  ): Promise<Result<{ count: number; errors: string[] }>> {
    return new Promise((resolve) => {
      const errors: string[] = [];
      let count = 0;
      let rowIndex = 0;
      const BATCH_SIZE = 500;
      let currentBatch = db.batch();
      let currentBatchSize = 0;
      const batchPromises: Promise<any>[] = [];

      const parser = fs.createReadStream(filePath).pipe(parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }));

      parser.on('data', (record: any) => {
        rowIndex++;
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
          errors.push(`Row ${rowIndex + 1}: ${msg}`);
        } else {
          const contactRef = db.collection('tenants')
            .doc(tenantId)
            .collection('contacts')
            .doc(contactData.id);
          currentBatch.set(contactRef, validation.data);
          count++;
          currentBatchSize++;

          if (currentBatchSize >= BATCH_SIZE) {
            batchPromises.push(currentBatch.commit());
            currentBatch = db.batch();
            currentBatchSize = 0;
          }
        }
      });

      parser.on('error', (error: any) => {
        logger.error('Error parsing CSV', error);
        if (error.code === 'CSV_INVALID_COLUMN_NAME') {
          resolve({ success: false, error: new Error('Invalid CSV headers. Please check for duplicates.') });
        } else {
          resolve({ success: false, error: error instanceof Error ? error : new Error(String(error)) });
        }
        parser.destroy();
      });

      parser.on('end', async () => {
        try {
          if (currentBatchSize > 0) {
            batchPromises.push(currentBatch.commit());
          }
          await Promise.all(batchPromises);

          if (rowIndex === 0) {
            resolve({ success: false, error: new Error("CSV contains no data rows") });
          } else {
            resolve({ success: true, data: { count, errors } });
          }
        } catch (error: any) {
          logger.error('Error committing batches', error);
          resolve({ success: false, error: error instanceof Error ? error : new Error(String(error)) });
        }
      });
    });
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

import { db } from '../lib/firebase.js';
import { firebaseService } from './FirebaseService.js';
import { ContactSchema, Result } from '../types/contracts.js';
import logger from '../utils/logger.js';
import crypto from 'crypto';
import { parse } from 'csv-parse';
import { Readable } from 'stream';

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
    stream: Readable
  ): Promise<Result<{ count: number; errors: string[] }>> {
    return new Promise((resolve, reject) => {
      const BATCH_SIZE = 500;
      let batch = db.batch();
      let records: any[] = [];
      const errors: string[] = [];
      let count = 0;
      let processedCount = 0;

      const parser = parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      parser.on('readable', async () => {
        try {
            let record;
            while ((record = parser.read()) !== null) {
              records.push(record);
              if (records.length >= BATCH_SIZE) {
                parser.pause();
                await processBatch();
                parser.resume();
              }
            }
        } catch (error) {
            reject(error);
            parser.destroy();
        }
      });

      parser.on('end', async () => {
        try {
            if (records.length > 0) {
              await processBatch();
            }
            resolve({ success: true, data: { count, errors } });
        } catch (error) {
            reject(error);
            parser.destroy();
        }
      });

      parser.on('error', (err) => {
        logger.error('Error importing contacts', err);
        if ((err as any).code === 'CSV_INVALID_COLUMN_NAME') {
            resolve({ success: false, error: new Error('Invalid CSV headers. Please check for duplicates.')});
        } else {
            reject(err);
        }
      });

      stream.pipe(parser);

      async function processBatch() {
        const chunk = records;
        records = [];

        chunk.forEach((record: any) => {
          const index = processedCount++;
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

        try {
          await batch.commit();
          batch = db.batch();
        } catch (error) {
          logger.error('Error committing batch', error);
          throw error;
        }
      }
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

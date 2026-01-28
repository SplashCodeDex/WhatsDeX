import { db } from '../lib/firebase.js';
import { firebaseService } from './FirebaseService.js';
import { ContactSchema, Result, Contact } from '../types/contracts.js';
import logger from '../utils/logger.js';
import crypto from 'crypto';
import { parse } from 'csv-parse';
import fs from 'fs';
import { pipeline } from 'stream/promises';

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

  /**
   * Import contacts using a stream to handle large files efficiently.
   */
  public async importContacts(
    tenantId: string,
    filePath: string
  ): Promise<Result<{ count: number; errors: string[] }>> {
    const errors: string[] = [];
    let count = 0;
    let rowIndex = 0;
    const BATCH_SIZE = 500;

    let currentBatch = db.batch();
    let currentBatchSize = 0;
    const batchPromises: Promise<any>[] = [];

    const csvParser = parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    try {
      const readStream = fs.createReadStream(filePath);

      csvParser.on('data', (record: any) => {
        rowIndex++;
        const phone = record.phone || record.phoneNumber || '';

        const contactData = {
          id: `cont_${crypto.randomUUID()}`,
          tenantId,
          name: record.name || record.fullName || 'Unknown',
          phone: phone ? normalizePhoneNumber(phone) : '',
          email: record.email || '',
          tags: record.tags ? record.tags.split('|').map((t: string) => t.trim()) : [],
          attributes: record,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'active'
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

      await pipeline(readStream, csvParser);

      // Final batch
      if (currentBatchSize > 0) {
        batchPromises.push(currentBatch.commit());
      }

      await Promise.all(batchPromises);

      if (rowIndex === 0) {
        return { success: false, error: new Error("CSV contains no data rows") };
      }

      return { success: true, data: { count, errors } };

    } catch (error: any) {
      logger.error('ContactService.importContacts error', error);
      if (error.code === 'CSV_INVALID_COLUMN_NAME') {
          return { success: false, error: new Error('Invalid CSV headers. Please check for duplicates.')};
      }
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  public async getAudience(tenantId: string): Promise<Result<any[]>> {
    try {
      const contacts = await firebaseService.getCollection('tenants/{tenantId}/contacts' as any, tenantId);
      return { success: true, data: contacts };
    } catch (error: any) {
      logger.error('Error fetching audience', error);
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }
}

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
    const errors: string[] = [];
    let count = 0;
    let rowIndex = 0;
    const BATCH_SIZE = 500;
    let currentBatch = db.batch();
    let currentBatchSize = 0;
    const batchPromises: Promise<void>[] = [];

    try {
      const parser = fs.createReadStream(filePath).pipe(parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }));

      for await (const record of parser) {
        rowIndex++;
        const rawData = record as Record<string, string>;
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
      }

      if (currentBatchSize > 0) {
        batchPromises.push(currentBatch.commit());
      }
      await Promise.all(batchPromises);

      if (rowIndex === 0) {
        return { success: false, error: new Error("CSV contains no data rows") };
      }

      return { success: true, data: { count, errors } };
    } catch (error: unknown) {
      logger.error('Error importing contacts', error);
      if (error && typeof error === 'object' && 'code' in error && error.code === 'CSV_INVALID_COLUMN_NAME') {
        return { success: false, error: new Error('Invalid CSV headers. Please check for duplicates.') };
      }
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  /**
   * Get all audience segments for a tenant
   */
  public async getAudience(tenantId: string): Promise<Result<unknown[]>> {
    try {
      const audiences = await firebaseService.getCollection<'tenants/{tenantId}/audiences'>('tenants/{tenantId}/audiences', tenantId);
      return { success: true, data: audiences };
    } catch (error: unknown) {
      logger.error('Error fetching audience segments', error);
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }
}

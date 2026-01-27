import { db } from '../lib/firebase.js';
import { firebaseService } from './FirebaseService.js';
import { ContactSchema, Result } from '../types/contracts.js';
import logger from '../utils/logger.js';
import crypto from 'crypto';
import { parse } from 'csv-parse';
import fs from 'fs';
import { pipeline } from 'stream/promises';
import { Writable } from 'stream';

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
    const BATCH_SIZE = 500;
    let batch = db.batch();
    let recordsInBatch = 0;

    const readStream = fs.createReadStream(filePath);
    const csvParser = parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const processingStream = new Writable({
      objectMode: true,
      async write(record, encoding, callback) {
        try {
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
            errors.push(`Row ${count + 2}: ${msg}`);
          } else {
            const contactRef = db.collection('tenants').doc(tenantId).collection('contacts').doc(contactData.id);
            batch.set(contactRef, validation.data);
            recordsInBatch++;
            count++;
            if (recordsInBatch >= BATCH_SIZE) {
              await batch.commit();
              batch = db.batch();
              recordsInBatch = 0;
            }
          }
          callback();
        } catch (error) {
          callback(error as Error);
        }
      },
      async final(callback) {
        try {
          if (recordsInBatch > 0) {
            await batch.commit();
          }
          callback();
        } catch (error) {
          callback(error as Error);
        }
      }
    });

    try {
      await pipeline(readStream, csvParser, processingStream);
      return { success: true, data: { count, errors } };
    } catch (error: any) {
      logger.error('Error in CSV import pipeline', error);
      if (error.code === 'CSV_INVALID_COLUMN_NAME') {
        return { success: false, error: new Error('Invalid CSV headers. Please check for duplicates.') };
      }
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    } finally {
      fs.unlink(filePath, (err) => {
        if (err) logger.error(`Failed to delete temp file: ${filePath}`, err);
      });
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

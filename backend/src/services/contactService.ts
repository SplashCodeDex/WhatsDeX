import { db } from '../lib/firebase.js';
import { firebaseService } from './FirebaseService.js';
import { ContactSchema, Result } from '../types/contracts.js';
import logger from '../utils/logger.js';
import crypto from 'crypto';
import { parse } from 'csv-parse';
import { Readable } from 'stream';

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
      const parser = parse({
        columns: true,
        trim: true,
        skip_empty_lines: true
      });

      const errors: string[] = [];
      let count = 0;
      let batch = db.batch();
      let batchSize = 0;
      const BATCH_SIZE = 500;

      stream.pipe(parser);

      parser.on('data', async (row: any) => {
        const rawData = row;

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
          errors.push(`Row Error: ${msg}`);
        } else {
          const contactRef = db.collection('tenants')
            .doc(tenantId)
            .collection('contacts')
            .doc(contactData.id);
          batch.set(contactRef, contactData);
          count++;
          batchSize++;

          if (batchSize >= BATCH_SIZE) {
            parser.pause();
            await batch.commit();
            batch = db.batch();
            batchSize = 0;
            parser.resume();
          }
        }
      });

      parser.on('end', async () => {
        if (batchSize > 0) {
          await batch.commit();
        }
        resolve({ success: true, data: { count, errors } });
      });

      parser.on('error', (err) => {
        logger.error('Error parsing CSV', err);
        reject({ success: false, error: new Error('Error parsing CSV') });
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

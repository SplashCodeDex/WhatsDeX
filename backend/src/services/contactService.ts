import { db } from '../lib/firebase.js';
import { firebaseService } from './FirebaseService.js';
import { ContactSchema, Result } from '../types/contracts.js';
import logger from '../utils/logger.js';
import crypto from 'crypto';

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
      const rows = csvData.split(/\r?\n/).filter(line => line.trim() !== '');
      if (rows.length < 2) {
        return { success: false, error: new Error("CSV is empty or missing headers") };
      }

      const headers = rows[0].split(',').map(h => h.trim());
      const contacts = rows.slice(1);
      const errors: string[] = [];
      let count = 0;

      // Process in batches of 500 (Firestore limit)
      const BATCH_SIZE = 500;
      for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
        const batch = db.batch();
        const chunk = contacts.slice(i, i + BATCH_SIZE);

        chunk.forEach((rowStr, chunkIndex) => {
          const index = i + chunkIndex;
          const values = rowStr.split(',').map(v => v.trim());

          const rawData: any = {};
          headers.forEach((header, hi) => {
            rawData[header] = values[hi] || '';
          });

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
          } else {
            const contactRef = db.collection('tenants')
              .doc(tenantId)
              .collection('contacts')
              .doc(contactData.id);
            batch.set(contactRef, contactData);
            count++;
          }
        });

        await batch.commit();
      }

      return { success: true, data: { count, errors } };

    } catch (error: any) {
      logger.error('Error importing contacts', error);
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

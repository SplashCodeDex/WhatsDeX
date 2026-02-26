import { firebaseService } from './FirebaseService.js';
import { ContactSchema, Result, type Contact } from '../types/contracts.js';
import logger from '../utils/logger.js';
import crypto from 'node:crypto';
import { parse } from 'csv-parse';
import fs from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { FieldValue } from 'firebase-admin/firestore';

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
   * Import contacts from CSV (2026 Streamed Edition)
   */
  public async importContacts(
    tenantId: string,
    filePath: string,
    botId?: string
  ): Promise<Result<{ count: number; errors: string[] }>> {
    const errors: string[] = [];
    let count = 0;
    let rowIndex = 0;
    const BATCH_SIZE = 500;
    let currentBatch = firebaseService.batch();
    let currentBatchSize = 0;

    try {
      const parser = parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      const readStream = fs.createReadStream(filePath);

      await pipeline(
        readStream,
        parser,
        async function(source: any) {
          for await (const record of source) {
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
              status: 'active' as const,
              createdAt: new Date(),
              updatedAt: new Date()
            };

            const validation = ContactSchema.safeParse(contactData);
            if (!validation.success) {
              const msg = validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
              errors.push(`Row ${rowIndex + 1}: ${msg}`);
            } else {
              currentBatch.set('contacts', contactData.id, validation.data, tenantId);
              count++;
              currentBatchSize++;

              if (currentBatchSize >= BATCH_SIZE) {
                await currentBatch.commit();
                currentBatch = firebaseService.batch();
                currentBatchSize = 0;
              }
            }
          }
        }
      );

      if (currentBatchSize > 0) {
        await currentBatch.commit();
      }

      // Update bot statistics (contactsCount) using increments via FirebaseService.batch()
      if (count > 0) {
        try {
          const statsBatch = firebaseService.batch();
          if (botId) {
            statsBatch.update('bots', botId, { 'stats.contactsCount': FieldValue.increment(count) } as any, tenantId);
          } else {
            const bots = await firebaseService.getCollection<'tenants/{tenantId}/bots'>('bots', tenantId);
            bots.forEach(bot => {
              statsBatch.update('bots', bot.id, { 'stats.contactsCount': FieldValue.increment(count) } as any, tenantId);
            });
          }
          await statsBatch.commit();
        } catch (statsError) {
          logger.error('Failed to update bot stats after import', statsError);
        }
      }

      if (rowIndex === 0) {
        return { success: false, error: new Error("CSV contains no data rows") };
      }

      return { success: true, data: { count, errors } };
    } catch (error: unknown) {
      logger.error('Error parsing CSV', error);
      const err = error as { code?: string; message?: string };
      if (err.code === 'CSV_INVALID_COLUMN_NAME') {
        return { success: false, error: new Error('Invalid CSV headers. Please check for duplicates.') };
      }
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  /**
   * List contacts for a tenant
   */
  public async listContacts(tenantId: string, limit: number = 100): Promise<Result<Contact[]>> {
    try {
      const contacts = await firebaseService.getCollection('contacts', tenantId) as Contact[];
      return { success: true, data: contacts.slice(0, limit) };
    } catch (error: unknown) {
      logger.error('ContactService.listContacts error', error);
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  /**
   * Create a new contact
   */
  public async createContact(tenantId: string, data: Partial<Contact>): Promise<Result<Contact>> {
    try {
      const id = data.id || `cont_${crypto.randomUUID()}`;
      const contactData = {
        ...data,
        id,
        tenantId,
        createdAt: data.createdAt || new Date(),
        updatedAt: new Date()
      };

      const validated = ContactSchema.parse(contactData);
      await firebaseService.setDoc('contacts', id, validated, tenantId, false);
      return { success: true, data: validated };
    } catch (error: unknown) {
      logger.error('ContactService.createContact error', error);
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  /**
   * Update a contact
   */
  public async updateContact(tenantId: string, contactId: string, updates: Partial<Contact>): Promise<Result<void>> {
    try {
      const contactData = {
        ...updates,
        updatedAt: new Date()
      };
      // updateDoc natively fails if the document doesn't exist
      await firebaseService.updateDoc('contacts', contactId, contactData, tenantId);
      return { success: true, data: undefined };
    } catch (error: unknown) {
      logger.error('ContactService.updateContact error', error);
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  /**
   * Delete a contact
   */
  public async deleteContact(tenantId: string, contactId: string): Promise<Result<void>> {
    try {
      await firebaseService.deleteDoc('contacts', contactId, tenantId);
      return { success: true, data: undefined };
    } catch (error: unknown) {
      logger.error('ContactService.deleteContact error', error);
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  /**
   * Get audiences for a tenant
   */
  public async getAudience(tenantId: string): Promise<Result<any[]>> {
    try {
      const audiences = await firebaseService.getCollection('audiences', tenantId);
      return { success: true, data: audiences };
    } catch (error: unknown) {
      logger.error('Error fetching audience', error);
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }
}

import { firebaseService } from './FirebaseService.js';
import { ContactSchema, Result, type Contact } from '../types/contracts.js';
import logger from '../utils/logger.js';
import crypto from 'node:crypto';
import { parse } from 'csv-parse';
import fs from 'node:fs';
import { admin } from '../lib/firebase.js';

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
   * Import contacts from CSV
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

    // Using firebaseService.batch() which is recommended by memory
    let batch = firebaseService.batch();
    let currentBatchSize = 0;
    const batchPromises: Promise<any>[] = [];

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
          // Use firebaseService for setting in batch
          batch.set('contacts', contactData.id, validation.data as any, tenantId);
          count++;
          currentBatchSize++;

          if (currentBatchSize >= BATCH_SIZE) {
            batchPromises.push(batch.commit());
            batch = firebaseService.batch();
            currentBatchSize = 0;
          }
        }
      }

      if (currentBatchSize > 0) {
        batchPromises.push(batch.commit());
      }
      await Promise.all(batchPromises);

      // Update bot statistics (contactsCount)
      if (count > 0) {
        try {
          if (botId) {
            // Update specific bot
            await firebaseService.setDoc<'tenants/{tenantId}/bots'>(
              'bots',
              botId,
              { 'stats.contactsCount': admin.firestore.FieldValue.increment(count) } as any,
              tenantId,
              true
            );
          } else {
            // Update all bots for this tenant to reflect new total
            const bots = await firebaseService.getCollection<'tenants/{tenantId}/bots'>('bots', tenantId);
            const statsPromises = bots.map(bot =>
              firebaseService.setDoc<'tenants/{tenantId}/bots'>(
                'bots',
                bot.id,
                { 'stats.contactsCount': admin.firestore.FieldValue.increment(count) } as any,
                tenantId,
                true
              )
            );
            await Promise.all(statsPromises);
          }
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
      const contacts = await firebaseService.getCollection('tenants/{tenantId}/contacts' as any, tenantId) as Contact[];
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
      await firebaseService.setDoc('tenants/{tenantId}/contacts' as any, id, validated, tenantId, false);
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
      await firebaseService.setDoc('tenants/{tenantId}/contacts' as any, contactId, contactData, tenantId, true);
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
      await firebaseService.deleteDoc('tenants/{tenantId}/contacts' as any, contactId, tenantId);
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
      const audiences = await firebaseService.getCollection('tenants/{tenantId}/audiences' as any, tenantId);
      return { success: true, data: audiences };
    } catch (error: unknown) {
      logger.error('Error fetching audience', error);
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }
}

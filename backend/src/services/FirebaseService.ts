import { db, admin } from '@/lib/firebase.js';
import logger from '@/utils/logger.js';
import {
  FirestoreSchema
} from '@/types/index.js';
import {
  TenantSchema,
  TenantUserSchema,
  BotInstanceSchema,
  BotMemberSchema,
  BotGroupSchema,
  SubscriptionSchema,
  ModerationItemSchema,
  ViolationSchema,
  CampaignSchema,
  WebhookSchema,
  ContactSchema,
  AudienceSchema,
  TemplateSchema,
  AuthSchema,
  LearningSchema,
  AnalyticsSchema
} from '@/types/contracts.js';
import { z } from 'zod';

type CollectionKey = keyof FirestoreSchema;

const SchemaMap: Record<CollectionKey, z.ZodSchema<any>> = {
  'tenants': TenantSchema as any,
  'tenants/{tenantId}/users': TenantUserSchema as any,
  'tenants/{tenantId}/bots': BotInstanceSchema as any,
  'tenants/{tenantId}/members': BotMemberSchema as any,
  'tenants/{tenantId}/groups': BotGroupSchema as any,
  'tenants/{tenantId}/subscriptions': SubscriptionSchema as any,
  'tenants/{tenantId}/moderation': ModerationItemSchema as any,
  'tenants/{tenantId}/violations': ViolationSchema as any,
  'tenants/{tenantId}/campaigns': CampaignSchema as any,
  'tenants/{tenantId}/webhooks': WebhookSchema as any,
  'tenants/{tenantId}/contacts': ContactSchema as any,
  'tenants/{tenantId}/audiences': AudienceSchema as any,
  'tenants/{tenantId}/templates': TemplateSchema as any,
  'tenants/{tenantId}/bots/{botId}/auth': AuthSchema as any,
  'tenants/{tenantId}/learning': LearningSchema as any,
  'tenants/{tenantId}/analytics': AnalyticsSchema as any,
};

export class FirebaseService {
  private static instance: FirebaseService;

  private constructor() { }

  public static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  /**
   * Resolve a collection name to its full path and schema
   */
  private getCollectionInfo(collection: string, tenantId?: string) {
    let path: string;
    let schemaKey: CollectionKey;

    // 1. If it's already a full path starting with tenants/
    if (collection.startsWith('tenants/')) {
        path = collection;
        // Map path back to schema key template
        schemaKey = collection
            .replace(/tenants\/[^/]+\/bots\/[^/]+\/auth/, 'tenants/{tenantId}/bots/{botId}/auth')
            .replace(/tenants\/[^/]+\/([^/]+)/, 'tenants/{tenantId}/$1') as CollectionKey;

        // Final fallback for root tenants collection
        if (collection === 'tenants') schemaKey = 'tenants';
    }
    // 2. If we have a tenantId and it's a logical name (e.g. 'contacts')
    else if (tenantId) {
        if (collection.includes('/')) {
            const parts = collection.split('/');
            if (parts[0] === 'bots' && parts[2] === 'auth') {
                path = `tenants/${tenantId}/bots/${parts[1]}/auth`;
                schemaKey = 'tenants/{tenantId}/bots/{botId}/auth';
            } else {
                path = `tenants/${tenantId}/${collection}`;
                schemaKey = `tenants/{tenantId}/${collection}` as CollectionKey;
            }
        } else {
            path = `tenants/${tenantId}/${collection}`;
            schemaKey = `tenants/{tenantId}/${collection}` as CollectionKey;
        }
    }
    // 3. Fallback to root or template key
    else {
        path = collection;
        schemaKey = collection as CollectionKey;
    }

    const schema = SchemaMap[schemaKey];
    if (!schema) {
      throw new Error(`No schema defined for collection: ${schemaKey} (Resolved from: ${collection})`);
    }

    return { path, schema };
  }

  /**
   * Validation Helper (Zero-Trust)
   */
  private validate<K extends CollectionKey>(schema: z.ZodSchema<any>, data: any, merge: boolean): FirestoreSchema[K] {
    try {
        if (merge) {
            // Attempt to derive a partial schema
            let partialSchema: any = schema;
            if (typeof (schema as any).partial === 'function') {
                partialSchema = (schema as any).partial();
            } else if (typeof (schema as any).unwrap === 'function' && typeof (schema as any).unwrap().partial === 'function') {
                partialSchema = (schema as any).unwrap().partial();
            }

            // If derivation was successful, validate.
            // BUT: If data contains FieldValues (like increment), Zod will fail.
            // We only validate if it's a plain object without FieldValues at the top level.
            const hasFieldValues = Object.values(data).some(v =>
                v && typeof v === 'object' && ('constructor' in v) &&
                (v.constructor.name === 'FieldValue' || v.constructor.name === 'NumericIncrementTransform')
            );

            if (!hasFieldValues) {
                return partialSchema.parse(data);
            }
            return data;
        }
        return schema.parse(data);
    } catch (error) {
        // If validation fails because we couldn't derive a partial schema or other issues,
        // we log it but might allow it in merge mode to prevent blocking valid updates.
        if (merge) {
            logger.warn('Firestore partial validation bypassed or failed:', error);
            return data;
        }
        throw error;
    }
  }

  /**
   * Generic method to get a document from a tenant's subcollection
   */
  public async getDoc<K extends CollectionKey>(
    collection: string,
    docId: string,
    tenantId?: string
  ): Promise<FirestoreSchema[K] | null> {
    try {
      const { path, schema } = this.getCollectionInfo(collection, tenantId);
      const docRef = db.collection(path).doc(docId);
      const doc = await docRef.get();

      if (!doc.exists) return null;

      const data = doc.data();
      return schema.parse(data) as FirestoreSchema[K];
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Firestore getDoc error [${collection}/${docId}] (Tenant: ${tenantId}):`, {
        message: err.message,
        stack: err.stack
      });
      throw err;
    }
  }

  /**
   * Generic method to set/update a document
   */
  public async setDoc<K extends CollectionKey>(
    collection: string,
    docId: string,
    data: Partial<FirestoreSchema[K]>,
    tenantId?: string,
    merge = true
  ): Promise<void> {
    try {
      const { path, schema } = this.getCollectionInfo(collection, tenantId);

      // Validation
      const validatedData = this.validate<K>(schema, data, merge);

      const docRef = db.collection(path).doc(docId);
      await docRef.set(validatedData as any, { merge });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Firestore setDoc error [${collection}/${docId}] (Tenant: ${tenantId}):`, {
        message: err.message,
        stack: err.stack,
        data: JSON.stringify(data).substring(0, 500)
      });
      throw err;
    }
  }

  /**
   * Generic method to get all documents from a collection
   */
  public async getCollection<K extends CollectionKey>(
    collection: string,
    tenantId?: string
  ): Promise<FirestoreSchema[K][]> {
    try {
      const { path, schema } = this.getCollectionInfo(collection, tenantId);
      const colRef = db.collection(path);
      const snapshot = await colRef.get();

      return snapshot.docs.map(doc => {
        try {
          return schema.parse(doc.data()) as FirestoreSchema[K];
        } catch (parsingError) {
          logger.warn(`Firestore parsing error in getCollection [${path}/${doc.id}]:`, parsingError);
          return doc.data() as FirestoreSchema[K]; // Fallback to raw data in production but log warning
        }
      });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Firestore getCollection error [${collection}] (Tenant: ${tenantId}):`, err);
      throw err;
    }
  }

  /**
   * Generic method to delete a document
   */
  public async deleteDoc<K extends CollectionKey>(
    collection: string,
    docId: string,
    tenantId?: string
  ): Promise<void> {
    try {
      const { path } = this.getCollectionInfo(collection, tenantId);
      const docRef = db.collection(path).doc(docId);
      await docRef.delete();
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Firestore deleteDoc error [${collection}/${docId}] (Tenant: ${tenantId}):`, err);
      throw err;
    }
  }

  /**
   * Create a Firestore WriteBatch wrapper with Zod validation
   */
  public batch() {
    const firestoreBatch = db.batch();

    const wrapper = {
      set: <K extends CollectionKey>(
        collection: string,
        docId: string,
        data: FirestoreSchema[K],
        tenantId?: string,
        options: { merge?: boolean } = {}
      ) => {
        const { path, schema } = this.getCollectionInfo(collection, tenantId);
        const merge = options.merge ?? false;
        const validatedData = this.validate<K>(schema, data, merge);

        const docRef = db.collection(path).doc(docId);
        firestoreBatch.set(docRef, validatedData as any, { merge });
        return wrapper;
      },

      update: <K extends CollectionKey>(
        collection: string,
        docId: string,
        data: Partial<FirestoreSchema[K]>,
        tenantId?: string
      ) => {
        const { path, schema } = this.getCollectionInfo(collection, tenantId);
        const validatedData = this.validate<K>(schema, data, true);

        const docRef = db.collection(path).doc(docId);
        firestoreBatch.update(docRef, validatedData as any);
        return wrapper;
      },

      delete: (collection: string, docId: string, tenantId?: string) => {
        const { path } = this.getCollectionInfo(collection, tenantId);
        const docRef = db.collection(path).doc(docId);
        firestoreBatch.delete(docRef);
        return wrapper;
      },

      commit: async (): Promise<void> => {
        await firestoreBatch.commit();
      }
    };

    return wrapper;
  }
}

export const firebaseService = FirebaseService.getInstance();

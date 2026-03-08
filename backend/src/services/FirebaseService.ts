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

export interface QueryOptions {
  where?: [string, admin.firestore.WhereFilterOp, any][];
  orderBy?: { field: string; direction?: 'asc' | 'desc' }[];
  limit?: number;
}

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

    if (tenantId) {
      // If collection already starts with tenants/ we assume it's a full path
      if (collection.startsWith('tenants/')) {
        path = collection.replace('{tenantId}', tenantId);
        schemaKey = collection as CollectionKey;
      }
      // Special handling for nested subcollections like bots/{botId}/auth
      else if (collection.includes('/')) {
        const parts = collection.split('/');
        // Pattern: bots/{botId}/auth
        if (parts[0] === 'bots' && parts[2] === 'auth') {
          path = `tenants/${tenantId}/bots/${parts[1]}/auth`;
          schemaKey = `tenants/{tenantId}/bots/{botId}/auth` as CollectionKey;
        } else {
          path = `tenants/${tenantId}/${collection}`;
          schemaKey = `tenants/{tenantId}/${collection}` as CollectionKey;
        }
      } else {
        path = `tenants/${tenantId}/${collection}`;
        schemaKey = `tenants/{tenantId}/${collection}` as CollectionKey;
      }
    } else {
      path = collection;
      schemaKey = collection as CollectionKey;
    }

    const schema = SchemaMap[schemaKey];
    if (!schema) {
      throw new Error(`No schema defined for collection: ${schemaKey}`);
    }

    return { path, schema };
  }

  /**
   * Validate data against a schema with support for partials and FieldValues
   */
  private validate(schema: z.ZodSchema<any>, data: any, merge: boolean): void {
    // Check if data contains Firestore FieldValues (like increment)
    // If so, we bypass full validation as Zod doesn't support these native types easily
    const hasFieldValues = Object.values(data).some(val => val instanceof admin.firestore.FieldValue);
    if (hasFieldValues) {
      return;
    }

    if (merge) {
      if (typeof (schema as any).partial === 'function') {
        (schema as any).partial().parse(data);
      } else if (typeof (schema as any).unwrap === 'function' && typeof (schema as any).unwrap().partial === 'function') {
        (schema as any).unwrap().partial().parse(data);
      }
      // If we can't derive a partial schema, we skip validation for merge to avoid blocking
    } else {
      schema.parse(data);
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

      this.validate(schema, data, merge);

      const docRef = db.collection(path).doc(docId);
      await docRef.set(data as any, { merge });
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
   * Generic method to add a document with auto-generated ID
   */
  public async addDoc<K extends CollectionKey>(
    collection: string,
    data: FirestoreSchema[K],
    tenantId?: string
  ): Promise<string> {
    try {
      const { path, schema } = this.getCollectionInfo(collection, tenantId);
      schema.parse(data);

      const docRef = await db.collection(path).add(data);
      return docRef.id;
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Firestore addDoc error [${collection}] (Tenant: ${tenantId}):`, err);
      throw err;
    }
  }

  /**
   * Generic method to get all documents from a collection with query options
   */
  public async getCollection<K extends CollectionKey>(
    collection: string,
    tenantId?: string,
    options?: QueryOptions
  ): Promise<FirestoreSchema[K][]> {
    try {
      const { path, schema } = this.getCollectionInfo(collection, tenantId);
      let query: admin.firestore.Query = db.collection(path);

      if (options) {
        if (options.where) {
          options.where.forEach(([field, op, val]) => {
            query = query.where(field, op, val);
          });
        }
        if (options.orderBy) {
          options.orderBy.forEach(({ field, direction }) => {
            query = query.orderBy(field, direction || 'asc');
          });
        }
        if (options.limit) {
          query = query.limit(options.limit);
        }
      }

      const snapshot = await query.get();

      return snapshot.docs.map(doc => {
        try {
          return schema.parse(doc.data()) as FirestoreSchema[K];
        } catch (parsingError) {
          logger.warn(`Firestore parsing error in getCollection [${path}/${doc.id}]:`, parsingError);
          return doc.data() as FirestoreSchema[K];
        }
      });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Firestore getCollection error [${collection}] (Tenant: ${tenantId}):`, err);
      throw err;
    }
  }

  /**
   * Get document count for a collection/query
   */
  public async getCount(
    collection: string,
    tenantId?: string,
    options?: Pick<QueryOptions, 'where'>
  ): Promise<number> {
    try {
      const { path } = this.getCollectionInfo(collection, tenantId);
      let query: admin.firestore.Query = db.collection(path);

      if (options?.where) {
        options.where.forEach(([field, op, val]) => {
          query = query.where(field, op, val);
        });
      }

      const snapshot = await query.count().get();
      return snapshot.data().count;
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Firestore getCount error [${collection}] (Tenant: ${tenantId}):`, err);
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
   * Get a new write batch
   */
  public batch() {
    const batch = db.batch();
    const service = this;

    return {
      set: <K extends CollectionKey>(
        collection: string,
        docId: string,
        data: Partial<FirestoreSchema[K]>,
        tenantId?: string,
        options: { merge?: boolean } = { merge: true }
      ) => {
        const { path, schema } = service.getCollectionInfo(collection, tenantId);
        service.validate(schema, data, options.merge ?? true);
        const docRef = db.collection(path).doc(docId);
        batch.set(docRef, data, options);
        return this;
      },
      update: <K extends CollectionKey>(
        collection: string,
        docId: string,
        data: Partial<FirestoreSchema[K]>,
        tenantId?: string
      ) => {
        const { path, schema } = service.getCollectionInfo(collection, tenantId);
        // update is essentially a merge
        service.validate(schema, data, true);
        const docRef = db.collection(path).doc(docId);
        batch.update(docRef, data as any);
        return this;
      },
      delete: (collection: string, docId: string, tenantId?: string) => {
        const { path } = service.getCollectionInfo(collection, tenantId);
        const docRef = db.collection(path).doc(docId);
        batch.delete(docRef);
        return this;
      },
      commit: () => batch.commit()
    };
  }

  /**
   * Run a transaction
   */
  public async runTransaction<T>(
    updateFunction: (transaction: admin.firestore.Transaction) => Promise<T>
  ): Promise<T> {
    return db.runTransaction(updateFunction);
  }
}

export const firebaseService = FirebaseService.getInstance();

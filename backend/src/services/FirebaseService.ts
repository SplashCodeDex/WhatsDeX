import { db } from '@/lib/firebase.js';
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
  AnalyticsSchema,
  CommandUsageSchema
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
  'tenants/{tenantId}/command_usage': CommandUsageSchema as any,
  'tenants/{tenantId}/events': z.any(),
  'analytics_legacy': z.any(),
  'conversation_embeddings': z.any(),
};

export interface QueryOptions {
  where?: [string, '==' | '>=' | '<=' | '>' | '<' | 'array-contains', any][];
  orderBy?: { field: string; direction?: 'asc' | 'desc' };
  limit?: number;
  offset?: number;
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
   * Expose a write batch
   */
  public batch() {
    return db.batch();
  }

  /**
   * Resolve a collection name to its full path and schema
   */
  private getCollectionInfo(collection: string, tenantId?: string) {
    let path: string;
    let schemaKey: CollectionKey;

    if (tenantId) {
      // Special handling for nested subcollections like bots/{botId}/auth
      if (collection.includes('/')) {
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

      // Validation (Zero-Trust)
      // Since data might be Partial, we use a partial schema for validation if merge is true
      if (merge) {
        // Best effort validation for partial updates
        // Note: Zod doesn't easily support dynamic partial validation against a deep schema
        // but for our flat-ish documents, it works well enough.
        // We safely check if .partial() exists (e.g. not a preprocessed or readonly schema)
        if (typeof (schema as any).partial === 'function') {
          (schema as any).partial().parse(data);
        } else if (typeof (schema as any).unwrap === 'function' && typeof (schema as any).unwrap().partial === 'function') {
          // Handle Readonly schemas
          (schema as any).unwrap().partial().parse(data);
        }
      } else {
        schema.parse(data);
      }

      const docRef = db.collection(path).doc(docId);
      await docRef.set(data, { merge });
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
   * Generic method to get all documents from a collection with querying
   */
  public async getCollection<K extends CollectionKey>(
    collection: string,
    tenantId?: string,
    options: QueryOptions = {}
  ): Promise<FirestoreSchema[K][]> {
    try {
      const { path, schema } = this.getCollectionInfo(collection, tenantId);
      let query: any = db.collection(path);

      if (options.where) {
        options.where.forEach(([field, op, value]) => {
          query = query.where(field, op, value);
        });
      }

      if (options.orderBy) {
        query = query.orderBy(options.orderBy.field, options.orderBy.direction || 'asc');
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.offset(options.offset);
      }

      const snapshot = await query.get();

      return snapshot.docs.map((doc: any) => {
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
   * Get count of documents in a collection with filters
   */
  public async getCount(
    collection: string,
    tenantId?: string,
    where?: [string, '==' | '>=' | '<=' | '>' | '<' | 'array-contains', any][]
  ): Promise<number> {
    try {
      const { path } = this.getCollectionInfo(collection, tenantId);
      let query: any = db.collection(path);

      if (where) {
        where.forEach(([field, op, value]) => {
          query = query.where(field, op, value);
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
   * Add a document to a collection with an auto-generated ID
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
}

export const firebaseService = FirebaseService.getInstance();

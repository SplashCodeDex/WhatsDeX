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
  AnalyticsSchema
} from '@/types/contracts.js';
import { z } from 'zod';
import admin from 'firebase-admin';

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

export class FirebaseBatch {
  private _batch: admin.firestore.WriteBatch;
  private service: FirebaseService;

  constructor(batch: admin.firestore.WriteBatch, service: FirebaseService) {
    this._batch = batch;
    this.service = service;
  }

  /**
   * Add a set/update operation to the batch with validation
   */
  public set<K extends CollectionKey>(
    collection: string,
    docId: string,
    data: Partial<FirestoreSchema[K]>,
    tenantId?: string,
    merge = true
  ): this {
    const { path, schema } = (this.service as any).getCollectionInfo(collection, tenantId);

    // Validation
    if (merge) {
      if (typeof (schema as any).partial === 'function') {
        (schema as any).partial().parse(data);
      } else if (typeof (schema as any).unwrap === 'function' && typeof (schema as any).unwrap().partial === 'function') {
        (schema as any).unwrap().partial().parse(data);
      }
    } else {
      schema.parse(data);
    }

    const docRef = db.collection(path).doc(docId);
    this._batch.set(docRef, data, { merge });
    return this;
  }

  /**
   * Add a delete operation to the batch
   */
  public delete(
    collection: string,
    docId: string,
    tenantId?: string
  ): this {
    const { path } = (this.service as any).getCollectionInfo(collection, tenantId);
    const docRef = db.collection(path).doc(docId);
    this._batch.delete(docRef);
    return this;
  }

  /**
   * Commit the batch
   */
  public async commit(): Promise<void> {
    await this._batch.commit();
  }
}

export interface CollectionQuery {
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
   * Create a new validated batch
   */
  public batch(): FirebaseBatch {
    return new FirebaseBatch(db.batch(), this);
  }

  /**
   * Resolve a collection name to its full path and schema
   */
  private getCollectionInfo(collection: string, tenantId?: string) {
    let path: string;
    let schemaKey: CollectionKey;

    if (tenantId) {
      // If it already starts with tenants/ or is a template, handle it robustly
      if (collection.startsWith('tenants/')) {
        path = collection.replace('{tenantId}', tenantId);
        // Normalize for SchemaKey
        schemaKey = collection.replace(/tenants\/[^/]+/, 'tenants/{tenantId}') as CollectionKey;
      } else {
        // Logical name or subpath relative to tenant
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
      }
    } else {
      path = collection;
      schemaKey = collection as CollectionKey;
    }

    const schema = SchemaMap[schemaKey];
    if (!schema) {
      throw new Error(`No schema defined for collection: ${schemaKey} (Resolved from: ${collection}, Tenant: ${tenantId})`);
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
      if (merge) {
        if (typeof (schema as any).partial === 'function') {
          (schema as any).partial().parse(data);
        } else if (typeof (schema as any).unwrap === 'function' && typeof (schema as any).unwrap().partial === 'function') {
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
   * Generic method to get all documents from a collection
   */
  public async getCollection<K extends CollectionKey>(
    collection: string,
    tenantId?: string
  ): Promise<FirestoreSchema[K][]> {
    return this.getCollectionWithQuery<K>(collection, tenantId);
  }

  /**
   * Generic method to get documents with filtering, ordering and limiting
   */
  public async getCollectionWithQuery<K extends CollectionKey>(
    collection: string,
    tenantId?: string,
    query?: CollectionQuery
  ): Promise<FirestoreSchema[K][]> {
    try {
      const { path, schema } = this.getCollectionInfo(collection, tenantId);
      let colRef: admin.firestore.Query = db.collection(path);

      if (query) {
        if (query.where) {
          query.where.forEach(w => {
            colRef = colRef.where(w[0], w[1], w[2]);
          });
        }
        if (query.orderBy) {
          query.orderBy.forEach(o => {
            colRef = colRef.orderBy(o.field, o.direction || 'asc');
          });
        }
        if (query.limit) {
          colRef = colRef.limit(query.limit);
        }
      }

      const snapshot = await colRef.get();

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
      logger.error(`Firestore getCollectionWithQuery error [${collection}] (Tenant: ${tenantId}):`, err);
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

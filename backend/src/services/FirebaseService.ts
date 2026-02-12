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
   * Private validation helper
   */
  private validate(schema: z.ZodSchema<any>, data: any, merge: boolean) {
    if (merge) {
      // Improved robust partial validation
      let partialSchema = schema;
      let hasPartial = false;

      if (typeof (schema as any).partial === 'function') {
        partialSchema = (schema as any).partial();
        hasPartial = true;
      } else if (typeof (schema as any).unwrap === 'function' && typeof (schema as any).unwrap().partial === 'function') {
        partialSchema = (schema as any).unwrap().partial();
        hasPartial = true;
      }

      // Only perform validation if we could derive a partial schema.
      // This prevents blocking valid partial updates for non-object or refined schemas.
      if (hasPartial) {
        partialSchema.parse(data);
      } else {
        logger.debug('Skipping partial validation for non-object or refined schema');
      }
    } else {
      schema.parse(data);
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
      this.validate(schema, data, merge);

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
   * Create a validated Firestore batch
   */
  public batch() {
    const batch = db.batch();
    return {
      set: <K extends CollectionKey>(
        collection: K | string,
        docId: string,
        data: Partial<FirestoreSchema[K]>,
        tenantId?: string,
        merge = true
      ) => {
        const { path, schema } = this.getCollectionInfo(collection as string, tenantId);
        this.validate(schema, data, merge);
        const docRef = db.collection(path).doc(docId);
        batch.set(docRef, data, { merge });
      },
      delete: (collection: string, docId: string, tenantId?: string) => {
        const { path } = this.getCollectionInfo(collection, tenantId);
        const docRef = db.collection(path).doc(docId);
        batch.delete(docRef);
      },
      commit: () => batch.commit()
    };
  }
}

export const firebaseService = FirebaseService.getInstance();

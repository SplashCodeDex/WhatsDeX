import { db } from '@/lib/firebase.js';
import logger from '@/utils/logger.js';
import { FirestoreSchema } from '@/types/index.js';

type CollectionKey = keyof FirestoreSchema;

export class FirebaseService {
  private static instance: FirebaseService;

  private constructor() {}

  public static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  /**
   * Get reference to a tenant's root document
   */
  private getTenantPath(tenantId: string): string {
    return `tenants/${tenantId}`;
  }

  /**
   * Get reference to a tenant's subcollection
   */
  private getTenantSubcollectionPath(tenantId: string, collection: string): string {
    return `tenants/${tenantId}/${collection}`;
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
      let docRef;
      
      if (tenantId) {
        docRef = db.collection('tenants').doc(tenantId).collection(collection).doc(docId);
      } else {
        // Some collections might be root-level, but for multi-tenancy we prioritize tenantId
        if (collection !== 'tenants') {
          throw new Error('Tenant ID is required for non-root collections');
        }
        docRef = db.collection(collection).doc(docId);
      }

      const doc = await docRef.get();
      return doc.exists ? (doc.data() as FirestoreSchema[K]) : null;
    } catch (error: any) {
      logger.error(`Firestore getDoc error [${collection}/${docId}]:`, error);
      throw error;
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
      let docRef;
      
      if (tenantId) {
        docRef = db.collection('tenants').doc(tenantId).collection(collection).doc(docId);
      } else {
        if (collection !== 'tenants') {
          throw new Error('Tenant ID is required for non-root collections');
        }
        docRef = db.collection(collection).doc(docId);
      }

      await docRef.set(data, { merge });
    } catch (error: any) {
      logger.error(`Firestore setDoc error [${collection}/${docId}]:`, error);
      throw error;
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
      let colRef;
      
      if (tenantId) {
        colRef = db.collection('tenants').doc(tenantId).collection(collection);
      } else {
        colRef = db.collection(collection);
      }

      const snapshot = await colRef.get();
      return snapshot.docs.map(doc => doc.data() as FirestoreSchema[K]);
    } catch (error: any) {
      logger.error(`Firestore getCollection error [${collection}]:`, error);
      throw error;
    }
  }
}

export const firebaseService = FirebaseService.getInstance();

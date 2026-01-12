import { db } from '../lib/firebase';
import logger from '../utils/logger';
import { Firestore } from 'firebase-admin/firestore';

// Helper to construct tenant-specific paths
const tenantPath = (tenantId: string, collection: string, docId?: string) => {
    if (!tenantId) {
        throw new Error('Tenant ID is required for all database operations.');
    }
    const path = `tenants/${tenantId}/${collection}`;
    return docId ? `${path}/${docId}` : path;
};

class DatabaseService {
    private db: Firestore;

    constructor() {
        if (!db) {
            logger.error('Firestore database is not initialized. DatabaseService cannot function.');
            throw new Error('Firestore not initialized');
        }
        this.db = db;
    }

    async getUser(tenantId: string, jid: string) {
        if (!this.db) return null;
        try {
            const docRef = this.db.doc(tenantPath(tenantId, 'users', jid));
            const doc = await docRef.get();
            if (!doc.exists) return null;
            return doc.data();
        } catch (error) {
            logger.error(`Error fetching user ${jid} for tenant ${tenantId}:`, { error });
            return null;
        }
    }

    async updateUser(tenantId: string, jid: string, data: any) {
        if (!this.db) return;
        try {
            const docRef = this.db.doc(tenantPath(tenantId, 'users', jid));
            await docRef.set(data, { merge: true });
        } catch (error) {
            logger.error(`Error updating user ${jid} for tenant ${tenantId}:`, { error });
        }
    }

    async getGroup(tenantId: string, jid: string) {
        if (!this.db) return null;
        try {
            const docRef = this.db.doc(tenantPath(tenantId, 'groups', jid));
            const doc = await docRef.get();
            return doc.exists ? doc.data() : null;
        } catch (error) {
            logger.error(`Error fetching group ${jid} for tenant ${tenantId}:`, { error });
            return null;
        }
    }

    async getBotSetting(tenantId: string, key: string) {
        if (!this.db) return null;
        try {
            const docRef = this.db.doc(tenantPath(tenantId, 'settings', 'bot'));
            const doc = await docRef.get();
            if (!doc.exists) return null;
            const data = doc.data();
            return data ? data[key] : null;
        } catch (error) {
            logger.error(`Error fetching bot setting ${key} for tenant ${tenantId}:`, { error });
            return null;
        }
    }

    // Generic method to fetch a document
    async getDoc(tenantId: string, collection: string, docId: string) {
        if (!this.db) return null;
        try {
            const docRef = this.db.doc(tenantPath(tenantId, collection, docId));
            const doc = await docRef.get();
            return doc.exists ? doc.data() : null;
        } catch (error) {
            logger.error(`Error fetching doc ${docId} from ${collection} for tenant ${tenantId}:`, { error });
            return null;
        }
    }

    // Generic method to set a document
    async setDoc(tenantId: string, collection: string, docId: string, data: any) {
        if (!this.db) return;
        try {
            const docRef = this.db.doc(tenantPath(tenantId, collection, docId));
            await docRef.set(data, { merge: true });
        } catch (error) {
            logger.error(`Error setting doc ${docId} in ${collection} for tenant ${tenantId}:`, { error });
        }
    }
}

export default new DatabaseService();

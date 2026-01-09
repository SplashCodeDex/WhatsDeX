import { db } from '../lib/firebase.js';
import logger from '../utils/logger.js';


class DatabaseService {
    private collection: string;

    constructor() {
        this.collection = 'users'; // Default collection
    }


    async getUser(jid: string) {
        if (!db) return null;
        try {
            const doc = await db.collection('users').doc(jid).get();
            if (!doc.exists) return null;
            return doc.data();
        } catch (error: any) {
            logger.error(`Error fetching user ${jid}:`, error);
            return null;
        }
    }

    async deleteUser(jid: string) {
        if (!db) return;
        try {
            await db.collection('users').doc(jid).delete();
        } catch (error: any) {
            logger.error(`Error deleting user ${jid}:`, error);
            throw error;
        }
    }

    async updateUser(jid: string, data: any) {
        if (!db) return;
        try {
            await db.collection('users').doc(jid).set(data, { merge: true });
        } catch (error: any) {
            logger.error(`Error updating user ${jid}:`, error);
        }
    }

    async getGroup(jid: string) {
        if (!db) return null;
        try {
            const doc = await db.collection('groups').doc(jid).get();
            return doc.exists ? doc.data() : null;
        } catch (error: any) {
            logger.error(`Error fetching group ${jid}:`, error);
            return null;
        }
    }

    async getBotSetting(key: string) {
        if (!db) return null;
        try {
            const doc = await db.collection('settings').doc('bot').get();
            if (!doc.exists) return null;
            return doc.data()[key];
        } catch (error: any) {
            logger.error('Error fetching bot settings', error);
            return null;
        }
    }
}

export default new DatabaseService();

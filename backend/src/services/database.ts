
import { db } from '../lib/firebase';
import logger from '../utils/logger';

class DatabaseService {
    constructor() {
        this.collection = 'users'; // Default collection
    }

    async getUser(jid) {
        if (!db) return null;
        try {
            const doc = await db.collection('users').doc(jid).get();
            if (!doc.exists) return null;
            return doc.data();
        } catch (error) {
            logger.error(`Error fetching user ${jid}:`, error);
            return null;
        }
    }

    async updateUser(jid, data) {
        if (!db) return;
        try {
            await db.collection('users').doc(jid).set(data, { merge: true });
        } catch (error) {
            logger.error(`Error updating user ${jid}:`, error);
        }
    }

    async getGroup(jid) {
        if (!db) return null;
        try {
            const doc = await db.collection('groups').doc(jid).get();
            return doc.exists ? doc.data() : null;
        } catch (error) {
            logger.error(`Error fetching group ${jid}:`, error);
            return null;
        }
    }

    async getBotSetting(key) {
        if (!db) return null;
        try {
            const doc = await db.collection('settings').doc('bot').get();
            if (!doc.exists) return null;
            return doc.data()[key];
        } catch (error) {
            logger.error('Error fetching bot settings', error);
            return null;
        }
    }
}

export default new DatabaseService();

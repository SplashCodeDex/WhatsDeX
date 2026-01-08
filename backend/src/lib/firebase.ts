import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { ConfigService } from '../services/ConfigService.js';
import logger from '../utils/logger.js';

let db: admin.firestore.Firestore;
const config = ConfigService.getInstance();


try {
    if (admin.apps.length === 0) {
        // If we have service account in config/env, use it.
        // Otherwise rely on ADC (Application Default Credentials)
        const options: any = {
            credential: admin.credential.applicationDefault()
        };

        // Check if we have explicit config path in env
        const serviceAccountPath = config.get('FIREBASE_SERVICE_ACCOUNT_PATH');
        if (serviceAccountPath) {
            const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
            options.credential = admin.credential.cert(serviceAccount);
        }


        admin.initializeApp(options);
        logger.info('🔥 Firebase Admin Initialized');
    }
    db = admin.firestore();
    db.settings({ ignoreUndefinedProperties: true });
} catch (error) {
    logger.error('Failed to initialize Firebase:', error);
    throw error;
}

export { admin, db };

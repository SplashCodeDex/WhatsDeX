
import admin from 'firebase-admin';
import config from '../config/config';
import logger from '../utils/logger';

let db;

try {
    if (admin.apps.length === 0) {
        // If we have service account in config/env, use it.
        // Otherwise rely on ADC (Application Default Credentials)
        const options = {
            credential: admin.credential.applicationDefault()
        };

        // Check if we have explicit config path in env
        if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
            options.credential = admin.credential.cert(require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH));
        }

        admin.initializeApp(options);
        logger.info('🔥 Firebase Admin Initialized');
    }
    db = admin.firestore();
    db.settings({ ignoreUndefinedProperties: true });
} catch (error) {
    logger.error('Failed to initialize Firebase:', error);
    // Fallback or re-throw depending on strictness.
    // For now, allow starting without DB but log error.
}

export { admin, db };

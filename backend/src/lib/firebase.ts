
import admin from 'firebase-admin';
import logger from '../utils/logger';
import { promises as fs } from 'fs';

let db: admin.firestore.Firestore | undefined;

const initializeFirebase = async () => {
    try {
        if (admin.apps.length === 0) {
            const options: admin.AppOptions = {};

            // Check if we have explicit config path in env
            if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
                try {
                    const serviceAccountContent = await fs.readFile(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf-8');
                    const serviceAccount = JSON.parse(serviceAccountContent);
                    options.credential = admin.credential.cert(serviceAccount);
                } catch (e: any) {
                    logger.error('Failed to load Firebase service account from path:', { error: e.message });
                    // Fallback to ADC
                    options.credential = admin.credential.applicationDefault();
                }
            } else {
                // Otherwise rely on ADC (Application Default Credentials)
                options.credential = admin.credential.applicationDefault();
            }

            admin.initializeApp(options);
            logger.info('🔥 Firebase Admin Initialized');
        }

        db = admin.firestore();
        db.settings({ ignoreUndefinedProperties: true });
    } catch (error: any) {
        logger.error('Failed to initialize Firebase:', { error: error.message });
        // Fallback or re-throw depending on strictness.
        // For now, allow starting without DB but log error.
    }
};

// Initialize on load
initializeFirebase();

export { admin, db };

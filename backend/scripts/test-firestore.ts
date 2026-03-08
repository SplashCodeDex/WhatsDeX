import * as admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './service-account.json';
const projectId = process.env.FIREBASE_PROJECT_ID;

console.log('--- Firestore Connectivity Test ---');
console.log('Project ID:', projectId);
console.log('Service Account Path:', serviceAccountPath);
console.log('Current Working Directory:', process.cwd());

const absolutePath = path.resolve(serviceAccountPath);
console.log('Resolved Absolute Path:', absolutePath);

if (!fs.existsSync(absolutePath)) {
    console.error('❌ Service account file not found at:', absolutePath);
    process.exit(1);
}

try {
    const serviceAccount = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
    console.log('✅ Service account file read successfully');
    console.log('Client Email:', serviceAccount.client_email);

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId
    });

    const db = admin.firestore();
    console.log('⏳ Attempting to fetch "tenants" collection...');

    // Set a timeout for the request
    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Firestore request timed out (30s)')), 30000)
    );

    const fetchPromise = db.collection('tenants').get();

    const snapshot = await Promise.race([fetchPromise, timeoutPromise]) as admin.firestore.QuerySnapshot;

    console.log(`✅ Success! Found ${snapshot.size} documents in "tenants" collection.`);
    snapshot.forEach(doc => {
        console.log(` - Document ID: ${doc.id}`);
    });

} catch (error: any) {
    console.error('❌ Firestore connection failed!');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    if (error.stack) {
        console.error('Stack Trace:', error.stack);
    }
} finally {
    process.exit(0);
}

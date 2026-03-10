import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve } from 'path';

async function testFirebase() {
    try {
        const saPath = resolve('w:/CodeDeX/DeXMart/backend/service-account.json');
        const sa = JSON.parse(readFileSync(saPath, 'utf-8'));

        console.log(`Testing connection to project: ${sa.project_id}`);

        if (getApps().length === 0) {
            initializeApp({
                credential: cert(sa)
            });
        }

        const db = getFirestore();
        // Just try to list collections or get a dummy doc to verify auth
        const collections = await db.listCollections();
        console.log(`Success! Found ${collections.length} collections.`);
        process.exit(0);
    } catch (error) {
        console.error('Firebase Check Failed:', error.message);
        process.exit(1);
    }
}

testFirebase();

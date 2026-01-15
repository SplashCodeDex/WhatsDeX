
import { db } from '../lib/firebase.js';

async function main() {
    try {
        console.log('Attempting to read from Firestore...');
        const snapshot = await db.collection('test').limit(1).get();
        console.log('Success! Docs:', snapshot.size);
        process.exit(0);
    } catch (error: any) {
        console.error('CONNECTION ERROR:', error.message);
        if (error.code) console.error('Error Code:', error.code);
        process.exit(1);
    }
}

main();

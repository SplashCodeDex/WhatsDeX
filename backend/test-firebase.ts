import { db } from './src/lib/firebase.js';

async function testFirebase() {
    try {
        console.log('Fetching tenants...');
        const tenants = await db.collection('tenants').get();
        console.log(`Found ${tenants.size} tenants.`);

        for (const tenant of tenants.docs) {
            console.log(`Tenant: ${tenant.id} (${tenant.data().name})`);
            const bots = await db.collection('tenants').doc(tenant.id).collection('bots').get();
            console.log(` - Bots: ${bots.size}`);
            for (const bot of bots.docs) {
                console.log(`   - Bot: ${bot.id} (${bot.data().name}) [Status: ${bot.data().status}]`);
            }
        }
    } catch (e) {
        console.error('Firebase Error:', e);
    }
}

testFirebase();

import axios from 'axios';

const baseURL = "http://localhost:3001/api";

async function verify() {
    try {
        const uniqueId = Math.floor(Math.random() * 10000);
        const email = `verify${uniqueId}@example.com`;
        
        console.log(`--- Registering User (${email}) ---`);
        const registerRes = await axios.post(`${baseURL}/auth/register`, {
            displayName: "Verify User",
            email: email,
            password: "password123",
            tenantName: "Verify Corp",
            plan: "PRO"
        });
        
        const token = registerRes.data.data.token;
        const tenantId = registerRes.data.data.tenant.id;
        console.log('Registration Success. Token acquired.');

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // 1. Import Contacts
        console.log('\n--- Importing Contacts ---');
        const contactRes = await axios.post(`${baseURL}/contacts/import`, {
            csvData: "name,phone,tags\nTest User,1234567890,verified"
        }, { headers });
        console.log('Contacts Import Success:', contactRes.data);

        // 2. Create Audience (Simulated for now by getting contacts directly)
        // In a real scenario, we'd use the audience API. For this test, we'll assume the 
        // CampaignWorker can load ALL contacts if targetId is 'all' or similar hack,
        // OR we need to create an Audience first. 
        
        // Since Audience API isn't built in this track, we'll create a dummy Audience doc directly in Firestore
        // via a mock/hack or just use the worker's logic.
        // Wait, the worker logic: 
        // const aud = await firebaseService.getDoc<Audience>('audiences', audience.targetId, tenantId);
        // It requires a valid Audience doc.
        // Since we didn't build the Audience CRUD API in this track (it was Phase 1 foundation but no API),
        // we might be blocked unless we have a way to create an Audience.
        
        // CHECK: Did we build Audience API? No, only Contact API routes.
        // CHECK: ContactService has `getAudience` but it returns empty array. 
        
        // WORKAROUND: I'll use the internal `firebaseService` if possible, but I can't access it from here.
        // I will rely on `importContacts` having created contacts.
        // I will try to create a campaign pointing to a non-existent audience and expect failure,
        // OR I will skip full campaign execution verification if I can't create dependencies. 
        
        // WAIT: Phase 1 had "Create Contact API Routes". Did it include Audience?
        // No.
        
        // CRITICAL: We cannot verify Campaign Execution without an Audience.
        // However, I can verify the Campaign Creation endpoint itself.
        
        // 3. Create Template
        console.log('\n--- Creating Template ---');
        const templateRes = await axios.post(`${baseURL}/templates`, {
            name: "Campaign Promo",
            content: "Hello {{name}}, verify this!",
            category: "marketing"
        }, { headers });
        const templateId = templateRes.data.data.id;
        console.log('Template Created:', templateId);

        // 4. Create Campaign
        console.log('\n--- Creating Campaign ---');
        // This will queue the job. It might fail in the worker due to missing Audience, but the API should succeed.
        const campaignRes = await axios.post(`${baseURL}/campaigns`, {
            name: "Live Test",
            templateId: templateId,
            audience: { type: "audience", targetId: "aud_missing_but_testing_flow" },
            distribution: { type: "single", botId: "bot_1" },
            antiBan: { aiSpinning: true, minDelay: 1, maxDelay: 2 },
            schedule: { type: "immediate" }
        }, { headers });
        console.log('Campaign Created:', campaignRes.data);

    } catch (error: any) {
        console.error('Verification failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

verify();

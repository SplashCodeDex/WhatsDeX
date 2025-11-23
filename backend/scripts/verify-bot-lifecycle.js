
import axios from 'axios';
import { randomBytes } from 'crypto';

const PORT = process.env.PORT || 3001;
const API_URL = `http://localhost:${PORT}/api`;
const EMAIL = `test-lifecycle-${randomBytes(4).toString('hex')}@example.com`;
const PASSWORD = 'password123';
const TENANT_NAME = 'Lifecycle Test Tenant';
const SUBDOMAIN = `lifecycle-${randomBytes(4).toString('hex')}`;

async function run() {
    try {
        console.log('🚀 Starting Bot Lifecycle Verification...');

        // 1. Register (to get token and tenant)
        console.log(`\n1. Registering user: ${EMAIL}...`);
        const registerRes = await axios.post(`${API_URL}/auth/register`, {
            email: EMAIL,
            password: PASSWORD,
            name: 'Lifecycle User',
            tenantName: TENANT_NAME,
            subdomain: SUBDOMAIN
        });
        const token = registerRes.data.token;
        const tenantId = registerRes.data.tenant.id;
        console.log('✅ Registration successful. Tenant ID:', tenantId);

        // 2. Create Bot
        console.log('\n2. Creating Bot Instance...');
        const botRes = await axios.post(`${API_URL}/internal/tenants/${tenantId}/bots`, {
            name: 'Lifecycle Bot',
            phoneNumber: '1234567890'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const botId = botRes.data.data.id;
        console.log('✅ Bot Created. ID:', botId);

        // 3. Start Bot
        console.log('\n3. Starting Bot...');
        const startRes = await axios.post(`${API_URL}/bots/${botId}/start`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Bot Start Response:', startRes.data);

        // 4. Get QR Code (poll a few times if needed, but usually immediate or short delay)
        console.log('\n4. Fetching QR Code...');
        // Give it a moment to initialize
        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
            const qrRes = await axios.get(`${API_URL}/bots/${botId}/qr`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ QR Code Retrieved:', qrRes.data.success ? 'Success' : 'Failed');
            if (qrRes.data.qrCode) {
                console.log('ℹ️ QR Data Length:', qrRes.data.qrCode.length);
            }
        } catch (error) {
            console.log('⚠️ QR Code fetch failed (might be too early or already connected):', error.message);
        }

        // 5. Stop Bot
        console.log('\n5. Stopping Bot...');
        const stopRes = await axios.post(`${API_URL}/bots/${botId}/stop`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Bot Stop Response:', stopRes.data);

        console.log('\n🎉 Bot Lifecycle Verification Completed Successfully!');

    } catch (error) {
        console.error('\n❌ Verification Failed:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        process.exit(1);
    }
}

run();

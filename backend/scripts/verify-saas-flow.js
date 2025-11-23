
import axios from 'axios';
import { randomBytes } from 'crypto';

const PORT = process.env.PORT || 3001;
const API_URL = `http://localhost:${PORT}/api`;
const EMAIL = `test-${randomBytes(4).toString('hex')}@example.com`;
const PASSWORD = 'password123';
const TENANT_NAME = 'Test Tenant';
const SUBDOMAIN = `test-${randomBytes(4).toString('hex')}`;

async function run() {
    try {
        console.log('🚀 Starting SaaS Flow Verification...');

        // 1. Register
        console.log(`\n1. Registering user: ${EMAIL}...`);
        const registerRes = await axios.post(`${API_URL}/auth/register`, {
            email: EMAIL,
            password: PASSWORD,
            name: 'Test User',
            tenantName: TENANT_NAME,
            subdomain: SUBDOMAIN
        });
        console.log('✅ Registration successful:', registerRes.data);

        const token = registerRes.data.token;
        if (!token) throw new Error('No token returned from registration');

        // 2. Login (Optional check, since register returns token)
        console.log('\n2. Verifying Login...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: EMAIL,
            password: PASSWORD
        });
        console.log('✅ Login successful');

        // 3. Get User Profile & Tenant
        console.log('\n3. Fetching User Profile...');
        const meRes = await axios.get(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ User Profile:', meRes.data);

        const tenantId = meRes.data.tenant.id;
        console.log('ℹ️ Tenant ID:', tenantId);

        // 4. Create Bot Instance
        console.log('\n4. Creating Bot Instance...');
        const botRes = await axios.post(`${API_URL}/internal/tenants/${tenantId}/bots`, {
            name: 'My First Bot',
            phoneNumber: '1234567890' // Optional, usually set after QR scan
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Bot Instance Created:', botRes.data);

        const botId = botRes.data.data.id;
        console.log('ℹ️ Bot ID:', botId);

        // 5. Check Bot Status / QR
        console.log('\n5. Checking Bot Status...');
        const statusRes = await axios.get(`${API_URL}/internal/tenants/${tenantId}/bots`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Bot Status:', statusRes.data);

        console.log('\n🎉 SaaS Flow Verification Completed Successfully!');

    } catch (error) {
        console.error('\n❌ Verification Failed:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        process.exit(1);
    }
}

run();

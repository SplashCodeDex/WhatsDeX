import { OpenClawGateway } from './services/openClawGateway.js';

async function reproduce() {
    console.log('>>> Testing OpenClawGateway.getHealth()...');
    const gateway = OpenClawGateway.getInstance();
    try {
        const health = await gateway.getHealth();
        console.log('Health Result:', JSON.stringify(health, null, 2));
    } catch (error: any) {
        console.error('Caught Expected Error:', error.message);
    }
}

reproduce();

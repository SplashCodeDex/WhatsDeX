import { antiBanService } from './services/antiBanService.js';
import logger from './utils/logger.js';

async function testAtomicVelocity() {
    logger.info('--- STARTING ATOMIC VELOCITY STRESS TEST ---');
    const channelId = 'test_number_123';
    
    // Simulate 10 concurrent requests
    logger.info('Dispatching 10 concurrent reservation requests...');
    const reservations = await Promise.all([
        antiBanService.reserveVelocityDelay(channelId),
        antiBanService.reserveVelocityDelay(channelId),
        antiBanService.reserveVelocityDelay(channelId),
        antiBanService.reserveVelocityDelay(channelId),
        antiBanService.reserveVelocityDelay(channelId),
        antiBanService.reserveVelocityDelay(channelId),
        antiBanService.reserveVelocityDelay(channelId),
        antiBanService.reserveVelocityDelay(channelId),
        antiBanService.reserveVelocityDelay(channelId),
        antiBanService.reserveVelocityDelay(channelId),
    ]);

    reservations.forEach((delay, i) => {
        logger.info(`Request ${i + 1}: Delay assigned = ${Math.round(delay)}ms`);
    });

    // Check if delays are increasing (since they are stacked)
    const sorted = [...reservations].sort((a, b) => a - b);
    const isAdvancing = reservations.every((val, i) => i === 0 || val >= reservations[i-1]);

    if (isAdvancing) {
        logger.info('✅ SUCCESS: Slots are strictly advancing. No race conditions detected.');
    } else {
        logger.error('❌ FAILURE: Slots are not strictly advancing! Race condition persists.');
    }

    process.exit(isAdvancing ? 0 : 1);
}

testAtomicVelocity();

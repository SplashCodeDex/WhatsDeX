logger.info('>>> [MASTERMIND] ABSOLUTE START OF MAIN.TS');
import { ConfigService } from './services/ConfigService.js';
import initializeContext from './lib/context.js';
import MultiTenantApp from './server/multiTenantApp.js';
import logger from './utils/logger.js';
import { getCampaignWorker } from './jobs/campaignWorker.js'; // Start Campaign Worker
import JobRegistry from './jobs/index.js';
import { jobQueueService } from './services/jobQueue.js';

/**
 * Main entry point for WhatsDeX
 */
async function main() {
    logger.info('>>> [MASTERMIND] Starting main()');
    try {
        logger.info('🚀 Starting WhatsDeX...');

        // Initialize ConfigService first
        const configService = ConfigService.getInstance();

        // 1. Initialize Context (without Prisma)
        const context = await initializeContext();
        logger.info('>>> [MASTERMIND] Global Context initialized.');

        // 2. Initialize Background Workers
        logger.info('>>> [MASTERMIND] Initializing Job Registry...');
        const jobRegistry = new JobRegistry();
        await jobQueueService.initialize();
        await jobRegistry.initialize(jobQueueService);
        
        logger.info('>>> [MASTERMIND] Initializing Campaign Worker...');
        getCampaignWorker();
        logger.info('>>> [MASTERMIND] Campaign Worker call finished.');

        // 3. Start Multi-tenant Server
        if (configService.get('USE_SERVER')) {
            logger.info('>>> [MASTERMIND] USE_SERVER is true. Initializing MultiTenantApp...');
            const app = new MultiTenantApp();
            await app.initialize();
            logger.info('>>> [MASTERMIND] MultiTenantApp initialized.');
            await app.start();
            logger.info('>>> [MASTERMIND] MultiTenantApp started.');
        } else {
            logger.info('🔕 Server disabled in configuration');
        }

        logger.info('✨ WhatsDeX is ready!');
    } catch (error: any) {
        logger.error('💥 Fatal error during startup:', error);
        process.exit(1);
    }
}

main();

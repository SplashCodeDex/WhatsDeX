import { ConfigService } from './services/ConfigService.js';
import initializeContext from './lib/context.js';
import MultiTenantApp from './server/multiTenantApp.js';
import logger from './utils/logger.js';

/**
 * Main entry point for WhatsDeX
 */
async function main() {
    try {
        logger.info('🚀 Starting WhatsDeX...');

        // Initialize ConfigService first
        const configService = ConfigService.getInstance();

        // 1. Initialize Context (without Prisma)
        const context = await initializeContext();

        // 2. Start Multi-tenant Server
        if (configService.get('USE_SERVER')) {
            const app = new MultiTenantApp();
            await app.initialize();
            await app.start();
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

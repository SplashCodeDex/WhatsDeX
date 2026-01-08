import 'dotenv/config';
import initializeContext from './lib/context';
import { startServer } from './server';
import logger from './utils/logger';

/**
 * Main entry point for WhatsDeX
 */
async function main() {
    try {
        logger.info('🚀 Starting WhatsDeX...');

        // 1. Initialize Context (without Prisma)
        const context = await initializeContext();

        // 2. Start Multi-tenant Server
        await startServer(context.config);

        logger.info('✨ WhatsDeX is ready!');
    } catch (error) {
        logger.error('💥 Fatal error during startup:', error);
        process.exit(1);
    }
}

main();

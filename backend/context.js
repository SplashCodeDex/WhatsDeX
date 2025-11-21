import { PrismaClient } from '@prisma/client';
import configManager from './src/config/ConfigManager.js';
import logger from './src/utils/logger.js';
import UnifiedCommandSystem from './src/services/UnifiedCommandSystem.js';
import UnifiedAIProcessor from './src/services/UnifiedAIProcessor.js';

export default async function initializeContext() {
    const config = configManager.export();
    const prisma = new PrismaClient();

    try {
        await prisma.$connect();
        logger.info('✅ Database connected successfully');
    } catch (error) {
        logger.error('❌ Database connection failed', error);
        process.exit(1);
    }

    const context = {
        config,
        logger,
        database: { prisma },
        shutdown: async () => {
            await prisma.$disconnect();
            logger.info('🛑 Context shutdown complete');
        }
    };

    // Initialize services with null bot initially
    // Bot will be attached in main.js
    context.commandSystem = new UnifiedCommandSystem(null, context);
    context.unifiedAI = new UnifiedAIProcessor(null, context);

    return context;
}

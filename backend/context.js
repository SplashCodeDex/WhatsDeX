import { PrismaClient } from '@prisma/client';
import configManager from './src/config/ConfigManager.js';
import logger from './src/utils/logger.js';
import * as formatter from './utils/formatter.js';
import consolefy from './src/utils/consolefy.js';
import UnifiedCommandSystem from './src/services/UnifiedCommandSystem.js';
import UnifiedAIProcessor from './src/services/UnifiedAIProcessor.js';
import database from './src/services/database.js';
import DatabaseService from './src/services/database.js';
import tools from './tools/exports.js';

export default async function initializeContext() {
    const config = configManager.export();
    const prisma = new PrismaClient();
    const dbService = new DatabaseService();

    try {
        await prisma.$connect();
        await dbService.connect();
        logger.info('✅ Database connected successfully');
    } catch (error) {
        logger.error('❌ Database connection failed', error);
        process.exit(1);
    }

    const context = {
        config,
        logger,
        formatter,
        consolefy,
        tools,
        database: dbService, // Use the instantiated service
        shutdown: async () => {
            await prisma.$disconnect();
            await dbService.disconnect();
            logger.info('🛑 Context shutdown complete');
        },
        state: {}
    };

    // Initialize services with null bot initially
    // Bot will be attached in main.js
    context.commandSystem = new UnifiedCommandSystem(null, context);
    context.unifiedAI = new UnifiedAIProcessor(null, context);

    return context;
}

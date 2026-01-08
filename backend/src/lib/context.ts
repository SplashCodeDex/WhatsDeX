// Prepared context for WhatsDeX - Firebase ready
import config from '../config/config';
import tools from '../tools/exports';
import * as formatter from '../utils/formatters';
import logger from '../utils/logger';
import state from '../utils/state';
import { CommandSystem } from '../services/commandSystem';
import { AIProcessor } from '../services/aiProcessor';

/**
 * Initialize and return the fully prepared context
 * Note: Database logic is being transitioned to Firebase
 */
async function initializeContext() {
    // Real Database Service
    const databaseService = (await import('../services/database.js')).default;

    // Legacy database interface for backward compatibility
    const database = {
        user: {
            get: jid => databaseService.getUser(jid),
            update: (jid, data) => databaseService.updateUser(jid, data),
        },
        group: {
            get: jid => databaseService.getGroup(jid),
        },
        bot: {
            get: key => databaseService.getBotSetting(key),
        },
    };

    // Build the context object
    const context = {
        config,
        database,
        databaseService,
        formatter,
        state,
        tools,
        logger,
    };

    // Instantiate systems that depend on context
    const commandSystem = new CommandSystem(null, context);
    const unifiedAI = new AIProcessor(null, context);
    context.commandSystem = commandSystem;
    context.unifiedAI = unifiedAI;

    return context;
}

export default initializeContext;

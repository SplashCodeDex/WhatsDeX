// Prepared context for WhatsDeX - Firebase ready
import { ConfigService } from '../services/ConfigService.js';
import tools from '../tools/exports.js';
import * as formatter from '../utils/formatters.js';
import logger from '../utils/logger.js';
import state from '../utils/state.js';
import { CommandSystem } from '../services/commandSystem.js';
import { AIProcessor } from '../services/aiProcessor.js';


/**
 * Initialize and return the fully prepared context
 * Note: Database logic is being transitioned to Firebase
 */
async function initializeContext(): Promise<any> {
    // Real Database Service
    const databaseService = (await import('../services/database.js')).default;

    // Legacy database interface for backward compatibility
    const database = {
        user: {
            get: (jid: string) => databaseService.getUser(jid),
            update: (jid: string, data: any) => databaseService.updateUser(jid, data),
        },
        group: {
            get: (jid: string) => databaseService.getGroup(jid),
        },
        bot: {
            get: (key: string) => databaseService.getBotSetting(key),
        },
    };

    // Build the context object
    const context: any = {
        config: ConfigService.getInstance(),
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

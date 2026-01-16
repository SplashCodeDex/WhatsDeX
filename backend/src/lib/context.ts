// Prepared context for WhatsDeX - Firebase ready
// 2026 Mastermind Edition - Strictly Typed
import { ConfigService } from '../services/ConfigService.js';
import tools from '../tools/exports.js';
import * as formatter from '../utils/formatters.js';
import logger from '../utils/logger.js';
import state from '../utils/state.js';
import { CommandSystem } from '../services/commandSystem.js';
import { GeminiAI } from '../services/geminiAI.js';
import { GlobalContext } from '../types/index.js';
import { groupService } from '../services/groupService.js';
import { databaseService } from '../services/database.js';
import { multiTenantBotService } from '../services/multiTenantBotService.js';
import { userService } from '../services/userService.js';
import { tenantConfigService } from '../services/tenantConfigService.js';

/**
 * Initialize and return the fully prepared global context
 */
async function initializeContext(): Promise<GlobalContext> {
    const config = ConfigService.getInstance();

    // Build the base context object
    const context: GlobalContext = {
        config,
        database: databaseService,
        databaseService,
        formatter,
        state,
        tools,
        logger,
        groupService,
        multiTenantBotService,
        userService,
        tenantConfigService,
        // These will be initialized below
        commandSystem: null as any,
        unifiedAI: null as any,
    };

    // Instantiate systems that depend on context
    const commandSystem = new CommandSystem(context);
    const unifiedAI = new GeminiAI(context);

    context.commandSystem = commandSystem;
    context.unifiedAI = unifiedAI;

    // Load commands eagerly
    await commandSystem.loadCommands();

    return context;
}

export default initializeContext;

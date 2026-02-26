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
import { multiTenantBotService } from '../archive/multiTenantBotService.js';
import { userService } from '../services/userService.js';
import { tenantConfigService } from '../services/tenantConfigService.js';
import { WhatsDeXToolBridge } from '../services/WhatsDeXToolBridge.js';
import { OpenClawSkillBridge } from '../services/OpenClawSkillBridge.js';

/**
 * Singleton state for context initialization
 */
let initializationPromise: Promise<GlobalContext> | null = null;

/**
 * Initialize and return the fully prepared global context
 * 2026 Mastermind Edition: Singleton implementation with Promise-based guard
 */
async function initializeContext(): Promise<GlobalContext> {
    logger.info('>>> [MASTERMIND] initializeContext() called');
    // If initialization is already in progress or completed, return the same promise
    if (initializationPromise) {
        logger.info('>>> [MASTERMIND] initializeContext() returning existing promise');
        return initializationPromise;
    }

    // Capture the initialization process in a promise
    initializationPromise = (async () => {
        logger.info('>>> [MASTERMIND] Starting fresh initialization');
        try {
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
            logger.info('>>> [MASTERMIND] Base context object built.');

            // Instantiate systems that depend on context
            const commandSystem = new CommandSystem(context);
            const unifiedAI = new GeminiAI(context);

            context.commandSystem = commandSystem;
            context.unifiedAI = unifiedAI;

            // 2026 Edition: Inject context into service to break circular dependency
            multiTenantBotService.setContext(context);

            // Load commands eagerly
            logger.info('Initializing Command System and loading commands...');
            await commandSystem.loadCommands();
            logger.info('>>> [MASTERMIND] Command loading finished. Getting mock bot...');

            // 2026 Edition: Bridge tools for AI
            logger.info('Bridging tools for Agentic Brain...');

            // We need a temporary bot mock to extract commands for bridging
            // since commands are tied to bot instances in WhatsDeX
            // AUDIT-INTENTIONAL(#8): mockBot only provides `cmd` (a Map<string, Command>),
            // which is the only property WhatsDeXToolBridge.registerCommands() accesses.
            // A full Bot instance isn't available at boot time (no WhatsApp connection yet).
            const mockBot = { cmd: commandSystem.getCommands() } as any;
            logger.info(`>>> [MASTERMIND] Mock bot created. Command count: ${mockBot.cmd.size}`);

            logger.info('>>> [MASTERMIND] Bridging WhatsDeX tools...');
            WhatsDeXToolBridge.registerCommands(mockBot);
            logger.info('>>> [MASTERMIND] WhatsDeX tools bridged successfully.');

            // Register OpenClaw Skills
            logger.info('>>> [MASTERMIND] Registering OpenClaw skills...');
            await OpenClawSkillBridge.registerSkills();
            logger.info('>>> [MASTERMIND] OpenClaw skills registered.');

            logger.info('✅ Global Context initialized successfully');
            logger.info('>>> [MASTERMIND] Global Context initialized successfully');
            return context;
        } catch (error) {
            logger.error('❌ Failed to initialize Global Context:', error);
            initializationPromise = null; // Reset to allow retry on failure
            throw error;
        }
    })();

    return initializationPromise;
}

export default initializeContext;

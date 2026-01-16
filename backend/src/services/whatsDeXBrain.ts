/**
 * WhatsDeXBrain - Legacy Alias for GeminiAI
 *
 * @deprecated Use GeminiAI directly
 * This module provides backward compatibility for imports using the old name.
 */

import { GeminiAI } from './geminiAI.js';
import { Bot, GlobalContext, MessageContext, Result } from '../types/index.js';
import logger from '../utils/logger.js';

/**
 * WhatsDeXBrain wraps GeminiAI for backward compatibility
 */
export class WhatsDeXBrain {
    private ai: GeminiAI;
    private bot: Bot;

    constructor(bot: Bot, context: GlobalContext) {
        this.bot = bot;
        this.ai = new GeminiAI(context);
        logger.debug('[WhatsDeXBrain] Initialized (wrapping GeminiAI)');
    }

    /**
     * Process message using GeminiAI
     */
    async processMessage(ctx: MessageContext): Promise<Result<void>> {
        return this.ai.processMessage(this.bot, ctx);
    }
}

export default WhatsDeXBrain;

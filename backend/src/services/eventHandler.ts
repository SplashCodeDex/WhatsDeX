/**
 * Event Handler Service (2026 Mastermind Edition)
 *
 * Centralized handler for Baileys events.
 * Triggers side effects like Group Sync, Analytics, etc.
 */

import { Bot } from '../types/index.js';
import logger from '../utils/logger.js';
import { groupService } from './groupService.js';
import { welcomeService } from './welcomeService.js';

export class EventHandler {

    /**
     * Bind all event listeners to a bot instance
     */
    bind(bot: Bot) {
        // Group Updates (Name, Desc, Settings)
        bot.ev.on('groups.update', async (updates) => {
            for (const update of updates) {
                if (!update.id) continue;
                logger.debug(`[${bot.botId}] Group update: ${update.id}`);
                await groupService.syncGroup(bot, update.id);
            }
        });

        // Participant Updates (Add, Remove, Promote, Demote)
        bot.ev.on('group-participants.update', async (update) => {
            if (!update.id) return;
            logger.debug(`[${bot.botId}] Participants update: ${update.id}`);
            await groupService.syncGroup(bot, update.id);

            // Trigger Welcome/Goodbye
            if (update.action === 'add' || update.action === 'remove') {
                const standardizedUpdate = {
                    ...update,
                    participants: update.participants.map((p: any) => typeof p === 'object' ? p.id || p.jid : p) as string[]
                };
                await welcomeService.handleGroupParticipantsUpdate(bot, standardizedUpdate);
            }
        });

        // Anti-Call Protection
        bot.ev.on('call', async (calls) => {
            if (!bot.config?.antiCall) return;

            for (const call of calls) {
                if (call.status === 'offer') {
                    logger.info(`[${bot.botId}] Incoming call from ${call.from}, rejecting...`);
                    // @ts-ignore - Baileys rejectCall type might be missing in some versions but works
                    if (bot.rejectCall) {
                        await bot.rejectCall(call.id, call.from);
                    }
                }
            }
        });

        // Initial Connection (Sync all groups?)
        // Note: Doing this on every connect might be heavy.
        // Better to rely on lazy sync or specific admin command 'sync-all'.
        // However, we can listen to 'connection.update' here if needed.
    }
}

export const eventHandler = new EventHandler();

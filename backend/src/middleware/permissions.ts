/**
 * Permission Middleware (2026 Mastermind Edition)
 *
 * Enforces command permissions based on the command definition
 * and the execution context (sender, group, etc.).
 */

import { Middleware, MessageContext } from '../types/index.js';
import logger from '../utils/logger.js';

export const permissionMiddleware: Middleware = async (ctx: MessageContext, next: () => Promise<void>) => {
    const cmd = ctx.commandDef;

    // If no command matched, or command has no permissions, just pass
    if (!cmd || !cmd.permissions) {
        return next();
    }

    const perms = cmd.permissions;
    const { formatter } = ctx.bot.context;

    // 1. Owner Check
    if (perms.owner && !ctx.sender.isOwner) {
        await ctx.replyReact('⛔');
        return ctx.reply(formatter.quote('⚠️ This command is restricted to the bot owner.'));
    }

    // 2. Group Only Check
    if (perms.group && !ctx.isGroup()) {
        return ctx.reply(formatter.quote('⚠️ This command can only be used in groups.'));
    }

    // 3. Private Only Check
    if (perms.private && ctx.isGroup()) {
        return ctx.reply(formatter.quote('⚠️ This command can only be used in private chat.'));
    }

    // 4. Admin Check (Group only)
    if (perms.admin && ctx.isGroup()) {
        if (!ctx.sender.isAdmin) {
            await ctx.replyReact('👮');
            return ctx.reply(formatter.quote('⚠️ You must be an admin to use this command.'));
        }
    }

    // 5. Bot Admin Check (Group only)
    if (perms.botAdmin && ctx.isGroup()) {
        // We need to check if bot is admin
        // Note: Generic ctx.group() implementation should provide this
        const isBotAd = await ctx.group().isBotAdmin();
        if (!isBotAd) {
            return ctx.reply(formatter.quote('⚠️ I need to be an admin to perform this action.'));
        }
    }

    // 6. Premium Check
    if (perms.premium) {
        // TODO: Access database to check premium status
        // For now, checks if owner (owners are always premium)
        if (!ctx.sender.isOwner) {
            // Check actual DB status using ctx.bot.context.databaseService
            // Assuming databaseService has isPremium method or user retrieval
            const { databaseService } = ctx.bot.context;
            const user = await databaseService.getUser(ctx.bot.tenantId, ctx.sender.jid);
            if (!user?.premium) {
                return ctx.reply(formatter.quote('🌟 This command is for Premium users only.'));
            }
        }
    }

    return next();
};

/**
 * Permission Middleware (2026 Mastermind Edition)
 *
 * Enforces command permissions based on the command definition
 * and the execution context (sender, group, etc.).
 */

import { Middleware, MessageContext } from '../types/index.js';
import logger from '../utils/logger.js';

export const permissionMiddleware: Middleware = async (ctx: MessageContext, next: () => Promise<void>) => {
    // 0. Bot-Level Access Control (Multi-Tenant Mode & SelfMode)
    const { mode, selfMode, disabledCommands = [] } = ctx.bot.config;

    const cmd = ctx.commandDef;

    // 0.1 Command Toggle Check (Command Store)
    if (cmd && disabledCommands.includes(cmd.name)) {
        return ctx.reply(`⚠️ The \`${cmd.name}\` command is currently disabled for this bot.`);
    }

    // Self Mode: Only owner/self can trigger
    if (selfMode && !ctx.sender.isOwner) {
        return; // Silent ignore for non-owners in self mode
    }

    // Mode Enforcement
    if (mode === 'group-only' && !ctx.isGroup()) {
        return ctx.reply('⚠️ This bot is configured to work in groups only.');
    }

    if (mode === 'private' && ctx.isGroup()) {
        return; // Silent ignore in groups if mode is private
    }

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
        if (!ctx.sender.isOwner) {
            const { databaseService } = ctx.bot.context;
            const user = await databaseService.getUser(ctx.bot.tenantId, ctx.sender.jid);
            if (!user?.premium) {
                return ctx.reply(formatter.quote('🌟 This command is for Premium users only.'));
            }
        }
    }

    return next();
};

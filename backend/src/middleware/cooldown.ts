import { Middleware, MessageContext } from '../types/index.js';
import { rateLimiterService } from '../services/rateLimiter.js';

export const cooldownMiddleware: Middleware = async (ctx: MessageContext, next: () => Promise<void>) => {
  const tenantId = ctx.bot.tenantId;
  const userId = ctx.sender.jid;

  // 1. Bot-Level Global Cooldown (Strict enforcement for AI & Commands)
  const botCooldownSec = (ctx.bot.config?.cooldownMs || 0) / 1000;
  if (botCooldownSec > 0) {
    const globalKey = `global_cooldown:${tenantId}:${userId}`;
    const globalAllowed = await rateLimiterService.check(globalKey, {
      points: 1,
      duration: botCooldownSec
    });

    if (!globalAllowed) {
      // 2026 Enhancement: Synchronize with presence
      if (ctx.sendPresenceUpdate) {
        await ctx.sendPresenceUpdate('paused');
      }
      await ctx.replyReact?.('⏳');
      return;
    }
  }

  // 2. Command-Specific Cooldown
  const cmd = ctx.commandDef || (ctx.used?.command ? ctx.bot.cmd?.get(ctx.used.command) : null);
  if (!cmd) {
    return next();
  }

  // 2. Command-Specific Cooldown
  const cooldownSec = (cmd as any).cooldown || 0;
  if (cooldownSec <= 0) return next();

  const commandName = cmd.name;

  // 3. Rate Limit Check
  const key = `cooldown:${tenantId}:${userId}:${commandName}`;
  const allowed = await rateLimiterService.check(key, {
    points: 1,
    duration: cooldownSec
  });

  if (!allowed) {
    await ctx.reply(`⏳ Please wait ${cooldownSec}s before using this command again.`);
    return;
  }

  return next();
};

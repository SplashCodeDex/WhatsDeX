import { Middleware, MessageContext } from '../types/index.js';
import { rateLimiterService } from '../services/rateLimiter.js';

export const cooldownMiddleware: Middleware = async (ctx: MessageContext, next: () => Promise<void>) => {
  const cmd = ctx.commandDef;
  if (!cmd) {
    return next();
  }

  const tenantId = ctx.bot.tenantId;
  const userId = ctx.sender.jid;

  // 1. Bot-Level Global Cooldown
  const botCooldownSec = (ctx.bot.config.cooldownMs || 0) / 1000;
  if (botCooldownSec > 0) {
    const globalKey = `global_cooldown:${tenantId}:${userId}`;
    const globalAllowed = await rateLimiterService.check(globalKey, {
      points: 1,
      duration: botCooldownSec
    });

    if (!globalAllowed) {
      // Silent ignore or small reaction to avoid spamming "wait" messages
      await ctx.replyReact('⏳');
      return;
    }
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

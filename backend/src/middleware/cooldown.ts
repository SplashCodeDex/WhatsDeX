import { Middleware, MessageContext } from '../types/index.js';
import { rateLimiterService } from '../services/rateLimiter.js';

export const cooldownMiddleware: Middleware = async (ctx: MessageContext, next: () => Promise<void>) => {
  const cmd = ctx.commandDef;
  if (!cmd) {
    return next();
  }

  const cooldownSec = (cmd as any).cooldown || 0;
  if (cooldownSec <= 0) return next();

  // 2. Resolve User ID
  const userId = ctx.sender.jid;
  const commandName = cmd.name;
  const tenantId = ctx.bot.tenantId;

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

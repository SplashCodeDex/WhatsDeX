import { Middleware, MessageContext } from '../types/index.js';
import { Timestamp } from 'firebase-admin/firestore';
import { databaseService } from '../services/database.js';
import { rateLimiterService } from '../services/rateLimiter.js';

// Simple Cooldown utility class for inline usage
export class Cooldown {
  public onCooldown: boolean = false;
  private ctx: MessageContext;
  private cooldownMs: number;

  constructor(ctx: MessageContext, cooldownMs: number) {
    this.ctx = ctx;
    this.cooldownMs = cooldownMs;
    // Synchronously check cooldown status based on context (simplified)
    // For real usage, use rateLimiterService or database
    this.onCooldown = false; // Placeholder, async check not possible in constructor
  }
}

export const cooldownMiddleware: Middleware = async (ctx: MessageContext, next: () => Promise<void>) => {
  // 1. Check if command exists and has cooldown
  // Note: commandDef is populated by CommandSystem before this runs
  const cmd = ctx.commandDef;
  if (!cmd || !ctx.cooldown) {
    // Core/types does not have cooldown in Command definition?
    // Let's check Command interface in types/index.ts
    // It seems 'cooldown' is missing from CommandPermissions or Command interface.
    // We will assume it might be added or we skip if not present.
    return next();
  }

  // For now, if cooldown is not defined in Command interface, we return next()
  // We should update Command interface to include cooldown number (seconds).
  // Let's assume passed in context 'cooldown' property if CommandSystem extracted it?
  // MessageContext has 'cooldown: unknown'.

  // If we want a robust system, we need 'cooldown' in Command interface (e.g. 5 seconds).
  // Let's access it via cmd generic if possible or skip for now until we update types.
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

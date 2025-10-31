const { z } = require('zod');

// Define Zod schemas for key commands
const schemas = new Map([
  // Downloader: youtubevideo - validate URL
  [
    'youtubevideo',
    z.object({
      url: z
        .string()
        .url()
        .startsWith('https://www.youtube.com/')
        .or(z.string().url().startsWith('https://youtu.be/')),
    }),
  ],
  // AI chat: chatgpt - validate prompt length
  [
    'chatgpt',
    z.object({
      prompt: z.string().min(1).max(2000),
    }),
  ],
  // General text commands: max length
  [
    'proverb',
    z.object({
      query: z.string().max(500),
    }),
  ],
  // Add more as needed, e.g., for other downloaders or AI
  [
    'tiktokdl',
    z.object({
      url: z.string().url().startsWith('https://www.tiktok.com/'),
    }),
  ],
  // Default for unknown: no validation
]);

module.exports = async (ctx, context) => {
  const { database } = context;
  const commandName = ctx.used.command;
  const schema = schemas.get(commandName);

  if (!schema) {
    // No schema for this command, allow
    return true;
  }

  // Parse input based on command
  let input;
  switch (commandName) {
    case 'youtubevideo':
    case 'tiktokdl':
      input = { url: ctx.args[0] || '' };
      break;
    case 'chatgpt':
    case 'proverb':
      input = { prompt: ctx.args.join(' '), query: ctx.args.join(' ') };
      break;
    default:
      input = { args: ctx.args.join(' ') };
  }

  const result = schema.safeParse(input);
  if (!result.success) {
    // Log to AuditLog
    try {
      await database.auditLog.create({
        eventType: 'input_validation_fail',
        actor: ctx.sender.jid,
        action: `Invalid input for command ${commandName}`,
        details: JSON.stringify(result.error.errors),
        riskLevel: 'medium',
        ipAddress: ctx.ipAddress || 'unknown', // If available
      });
    } catch (logError) {
      console.error('Failed to log validation error:', logError);
    }

    // Reply error to user
    const errorMsg = `Invalid input for ${ctx.used.prefix}${commandName}. Please check your arguments. Error: ${result.error.message}`;
    await ctx.reply(errorMsg);

    return false; // Block command execution
  }

  // Valid input
  return true;
};

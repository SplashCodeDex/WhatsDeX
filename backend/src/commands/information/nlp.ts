import { MessageContext } from '../../types/index.js';
import NLPProcessorService from '../../services/nlpProcessor.js';
import { cacheService } from '../../services/cache.js';
import * as formatter from '../../utils/formatters.js';
import logger from '../../utils/logger.js';

export default {
  name: 'nlp',
  aliases: ['understand', 'parse', 'intent'],
  category: 'information',
  permissions: {
    coin: 5,
  },
  code: async (ctx: MessageContext) => {
    const { config } = ctx.channel.context;

    try {
      const input = ctx.args.join(' ') || ctx.quoted?.content || '';

      if (!input) {
        return ctx.reply(
          formatter.quote(
            '❎ Please provide some text for me to analyze. For example: "download a funny cat video" or "tell me a joke"'
          )
        );
      }

      // Initialize NLP service
      const nlpService = new NLPProcessorService();

      // Get user's recent commands for context
      // Note: ctx.author doesn't exist on MessageContext, referring to previous context issues.
      // Assuming userId is ctx.sender.jid based on recent fixes.
      const userId = ctx.sender.jid;
      const tenantId = ctx.channel.tenantId;

      // Fetch user's recent commands from cache for context
      const historyKey = `nlp:history:${tenantId}:${userId}`;
      const historyResult = await cacheService.get<string[]>(historyKey);
      const recentCommands = historyResult.success && historyResult.data ? historyResult.data : [];

      const userDb = await ctx.channel.context.database.user.get(userId, tenantId);

      // Fetch owner number from tenant settings
      const tenantResult = await ctx.channel.context.tenantConfigService.getTenantSettings(tenantId);
      const ownerNumber = (tenantResult.success ? tenantResult.data.ownerNumber : 'system') || 'system';

      // Process the input
      const result = await nlpService.processInput(input, {
        userId: userId,
        recentCommands,
        isGroup: ctx.isGroup(),
        isAdmin: ctx.isGroup() ? await ctx.group().isAdmin(ctx.sender.jid) : false,
        isOwner: ctx.channel.context.tools.cmd.isOwner(
          [ownerNumber],
          ctx.getId(ctx.sender.jid),
          ctx.msg.key?.id
        ),
      });

      // Format the response
      let response = `🧠 **NLP Analysis Results**\n\n`;
      response += `📝 **Input:** "${input}"\n\n`;
      response += `🎯 **Detected Intent:** ${result.intent}\n`;
      response += `📊 **Confidence:** ${Math.round(result.confidence * 100)}%\n`;
      response += `💡 **Explanation:** ${result.explanation}\n\n`;

      if (result.command) {
        response += `🚀 **Suggested Command:** ${ctx.used.prefix}${result.command}\n`;

        if (result.parameters && Object.keys(result.parameters).length > 0) {
          response += `⚙️ **Parameters:**\n`;
          for (const [key, value] of Object.entries(result.parameters)) {
            response += `   • ${key}: ${value}\n`;
          }
        }

        if (result.alternatives && result.alternatives.length > 0) {
          response += `\n🔄 **Alternatives:** ${result.alternatives.map((cmd: string) => `${ctx.used.prefix}${cmd}`).join(', ')}\n`;
        }

        response += `\n💭 *Would you like me to execute this command? Reply with "yes" or use the command directly!*`;
      } else {
        response += `💡 *Try being more specific or use* ${ctx.used.prefix}menu *to see all commands.*`;
      }

      // Update history (last 5 commands)
      const updatedHistory = [input, ...recentCommands].slice(0, 5);
      await cacheService.set(historyKey, updatedHistory, 1800); // 30 mins

      await ctx.reply({
        text: response,
        footer: config.msg.footer,
      });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Error in NLP command:', err);
      return ctx.reply(
        formatter.quote(`❎ An error occurred while analyzing your input: ${err.message}`)
      );
    }
  },
};

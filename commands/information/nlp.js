import NLPProcessorService from '../../src/services/nlpProcessor.js';
import { formatter } from '../../src/utils/logger.js';

export default {
  name: 'nlp',
  aliases: ['understand', 'parse', 'intent'],
  category: 'information',
  permissions: {
    coin: 5,
  },
  code: async ctx => {
    const { config } = ctx.bot.context;

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
      const userDb = await ctx.bot.context.database.user.get(ctx.author.id);
      const recentCommands = userDb?.recentCommands || [];

      // Process the input
      const result = await nlpService.processInput(input, {
        userId: ctx.author.id,
        recentCommands,
        isGroup: ctx.isGroup(),
        isAdmin: ctx.isGroup() ? await ctx.group().isAdmin(ctx.sender.jid) : false,
        isOwner: ctx.bot.context.tools.cmd.isOwner(
          config,
          ctx.getId(ctx.sender.jid),
          ctx.msg.key.id
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
          response += `\n🔄 **Alternatives:** ${result.alternatives.map(cmd => `${ctx.used.prefix}${cmd}`).join(', ')}\n`;
        }

        response += `\n💭 *Would you like me to execute this command? Reply with "yes" or use the command directly!*`;
      } else {
        response += `🤔 **No specific command suggestion available.**\n`;
        response += `💡 *Try being more specific or use* ${ctx.used.prefix}menu *to see all commands.*`;
      }

      await ctx.reply({
        text: response,
        footer: config.msg.footer,
      });
    } catch (error) {
      console.error('Error in NLP command:', error);
      return ctx.reply(
        formatter.quote(`❎ An error occurred while analyzing your input: ${error.message}`)
      );
    }
  },
};

import { MessageContext } from '../../types/index.js';
import CommandSuggestionsService from '../../services/commandSuggestions.js';
import * as formatter from '../../utils/formatters.js';
import logger from '../../utils/logger.js';

interface CommandHistory {
  command: string;
  category: string;
  usedAt: number;
}

export default {
  name: 'suggest',
  aliases: ['suggestions', 'helpme', 'whatcanido'],
  category: 'information',
  permissions: {
    coin: 5,
  },
  code: async (ctx: MessageContext) => {
    try {
      const userInput = ctx.args.join(' ') || (ctx.quoted as any)?.content || '';

      if (!userInput) {
        return ctx.reply(
          formatter.quote(
            '❎ Please provide some text or describe what you want to do. For example: "download a YouTube video" or "generate an image"'
          )
        );
      }

      const suggestionsService = new CommandSuggestionsService();
      const userId = (ctx as any).user?.id || ctx.sender.jid || (ctx as any).author?.id;

      // Cast to any to bypass strict type check on suggestCommands argument if service definition is loose/strict mismatch
      const recentCommands = (await suggestionsService.getUserCommandHistory(userId)) as any[];
      const suggestions = await suggestionsService.suggestCommands(userInput, recentCommands);

      if (suggestions.length === 0) {
        return ctx.reply(
          formatter.quote(
            "🤔 I couldn't find any specific command suggestions for your request. Try using `/menu` to see all available commands."
          )
        );
      }

      let response = `💡 **Command Suggestions for:** "${userInput}"\n\n`;

      suggestions.forEach((suggestion: any, index: number) => {
        const confidencePercent = Math.round(suggestion.confidence * 100);
        const confidenceIcon =
          confidencePercent >= 80 ? '🔥' : confidencePercent >= 60 ? '👍' : '🤔';

        response += `${index + 1}. **${ctx.used.prefix}${suggestion.command}**\n`;
        response += `   ${confidenceIcon} ${suggestion.description}\n`;
        response += `   📊 Confidence: ${confidencePercent}%\n`;
        response += `   🏷️ Category: ${suggestion.category}\n\n`;
      });

      response += `💡 *Tip: Use the command prefix (${ctx.used.prefix}) before any command*\n`;
      response += `📚 *Need more help? Try* ${ctx.used.prefix}menu *to see all commands*`;

      await ctx.reply(response);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Error in suggest command:', err);
      return ctx.reply(
        formatter.quote(`❎ An error occurred while generating suggestions: ${err.message}`)
      );
    }
  },
};
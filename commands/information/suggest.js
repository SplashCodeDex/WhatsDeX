const CommandSuggestionsService = require('../../src/services/commandSuggestions');
const { formatter } = require('../../src/utils/logger');

module.exports = {
  name: 'suggest',
  aliases: ['suggestions', 'helpme', 'whatcanido'],
  category: 'information',
  permissions: {
    coin: 5,
  },
  code: async (ctx) => {
    const { config } = ctx.bot.context;

    try {
      const userInput = ctx.args.join(' ') || ctx.quoted?.content || '';

      if (!userInput) {
        return ctx.reply(formatter.quote('❎ Please provide some text or describe what you want to do. For example: "download a YouTube video" or "generate an image"'));
      }

      // Initialize suggestions service
      const suggestionsService = new CommandSuggestionsService();

      // Get user's recent command history (mock for now)
      const recentCommands = await suggestionsService.getUserCommandHistory(ctx.author.id);

      // Generate suggestions
      const suggestions = await suggestionsService.suggestCommands(userInput, recentCommands);

      if (suggestions.length === 0) {
        return ctx.reply(formatter.quote('🤔 I couldn\'t find any specific command suggestions for your request. Try using `/menu` to see all available commands.'));
      }

      // Format suggestions for display
      let response = `💡 **Command Suggestions for:** "${userInput}"\n\n`;

      suggestions.forEach((suggestion, index) => {
        const confidencePercent = Math.round(suggestion.confidence * 100);
        const confidenceIcon = confidencePercent >= 80 ? '🔥' : confidencePercent >= 60 ? '👍' : '🤔';

        response += `${index + 1}. **${ctx.used.prefix}${suggestion.command}**\n`;
        response += `   ${confidenceIcon} ${suggestion.description}\n`;
        response += `   📊 Confidence: ${confidencePercent}%\n`;
        response += `   🏷️ Category: ${suggestion.category}\n\n`;
      });

      response += `💡 *Tip: Use the command prefix (${ctx.used.prefix}) before any command*\n`;
      response += `📚 *Need more help? Try* ${ctx.used.prefix}menu *to see all commands*`;

      await ctx.reply(response);

    } catch (error) {
      console.error('Error in suggest command:', error);
      return ctx.reply(formatter.quote(`❎ An error occurred while generating suggestions: ${error.message}`));
    }
  },
};
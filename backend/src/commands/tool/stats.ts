import redisClient from '../../lib/redis';

export default {
  name: 'stats',
  category: 'tool',
  description: 'Displays usage statistics for the bot.',
  isOwner: true, // Make this an owner-only command
  code: async ctx => {
    const { formatter } = ctx.bot.context;

    try {
      await ctx.react('📊');

      // Fetch total commands
      const totalCommands = await redisClient.get('analytics:totalCommands') || 0;

      // Fetch all command counts from the hash
      const commandCounts = await redisClient.hgetall('analytics:commands');

      let responseText = `*📊 Bot Usage Statistics*\n\n`;
      responseText += `*Total Commands Executed:* ${totalCommands}\n\n`;

      if (Object.keys(commandCounts).length > 0) {
        // Sort commands by usage
        const sortedCommands = Object.entries(commandCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10); // Get top 10 commands

        responseText += `*Top 10 Most Used Commands:*\n`;
        sortedCommands.forEach(([command, count], index) => {
          responseText += `${index + 1}. *${command}*: ${count} uses\n`;
        });
      } else {
        responseText += `No command usage data available yet.`;
      }

      await ctx.reply(formatter.quote(responseText));
    } catch (error) {
      console.error('Error fetching stats:', error);
      await ctx.reply('❌ An error occurred while fetching statistics.');
    }
  },
};

import { MessageContext } from '../../types/index.js';
import multiTenantBotService from '../../services/multiTenantBotService.js';

/**
 * List JadiBot Command
 * List all active bot instances
 */

export default {
  name: 'listjadibot',
  description: 'List all active bot instances',
  category: 'Owner',
  usage: '!listjadibot',
  aliases: ['listbots', 'bots'],
  cooldown: 10,

  code: async (ctx: MessageContext) => {
    try {
      // Get active bots
      const activeBots = multiTenantBotService.getActiveBots();
      const stats = multiTenantBotService.getStats();

      if (activeBots.length === 0) {
        return await ctx.reply('No active bot instances found.');
      }

      let response = '🤖 *Active Bot Instances*\n\n';
      response += `Total Bots: ${stats.activeBots}\n`;
      response += `Running Processes: ${stats.runningProcesses}\n\n`;

      activeBots.forEach((bot: any, index: number) => {
        response += `${index + 1}. ${bot.id}\n`;
        response += `   Status: 🟢 Active\n`;
        response += `\n`;
      });

      await ctx.reply(response);

      console.log(`List jadibot requested by ${ctx.sender.id}, found ${activeBots.length} bots`);
    } catch (error: any) {
      console.error('Error in listjadibot command:', error);
      await ctx.reply('Terjadi kesalahan saat mengambil daftar bot. Silakan coba lagi.');
    }
  },
};
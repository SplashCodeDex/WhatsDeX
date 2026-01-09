import { MessageContext } from '../../types/index.js';
import multiTenantBotService from '@/services/multiTenantBotService.js';

/**
 * Stop JadiBot Command
 * Stop user's bot instance
 */

export default {
  name: 'stopjadibot',
  description: 'Stop your bot instance',
  category: 'Owner',
  usage: '!stopjadibot',
  aliases: ['stopbot', 'deljadibot'],
  cooldown: 10,

  execute: async (ctx: MessageContext) => {
    const { multiTenantBotService } = ctx.bot.context;
    const userId = ctx.sender.jid;

    try {
      // Check if user has active bot
      if (!multiTenantBotService.hasActiveBot(userId)) {
        return await ctx.reply("You don't have an active bot instance!");
      }

      await ctx.reply('⏳ Stopping your bot instance...');

      // Stop bot instance
      await multiTenantBotService.stopBot(userId);

      await ctx.reply('✅ Bot instance stopped successfully!');
      console.log(`JadiBot stopped for ${userId}`);
    } catch (error: any) {
      console.error('Error in stopjadibot command:', error);

      if (error.message.includes("don't have an active bot")) {
        await ctx.reply("You don't have an active bot instance!");
      } else {
        await ctx.reply(`Terjadi kesalahan saat menghentikan bot instance: ${error.message}`);
      }
    }
  },
};

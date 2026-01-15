import { MessageContext } from '../../types/index.js';
import multiTenantBotService from '../../services/multiTenantBotService.js';
import logger from '../../utils/logger.js';

/**
 * JadiBot Command
 * Allow users to create their own bot instances
 */

export default {
  name: 'jadibot',
  description: 'Create your own bot instance',
  category: 'Owner',
  usage: '!jadibot',
  aliases: ['createbot', 'multibot'],
  cooldown: 60,

  execute: async (ctx: MessageContext) => {
    const { multiTenantBotService, userService } = ctx.bot.context;
    const userId = ctx.sender.jid;

    try {
      // Check if user already has active bot
      if (multiTenantBotService.hasActiveBot(userId)) {
        return await ctx.reply(
          'You already have an active bot instance!\nUse !stopjadibot to stop your current bot.'
        );
      }

      // Check if user is premium
      const user = await userService.getUserById(ctx.bot.tenantId, userId);
      const isPremium = user?.metadata?.premium || false;
      const isCreator = user?.role === 'owner';

      if (!isPremium && !isCreator) {
        return await ctx.reply(
          'This feature requires premium access.\nContact admin to get premium access.'
        );
      }

      await ctx.reply('⏳ Creating your bot instance...\nThis may take a few moments.');

      // Create bot instance
      await multiTenantBotService.createBotInstance(ctx.bot.tenantId, {
        name: `${user?.displayName || 'User'}'s Bot`,
        userId: userId
      });

      await ctx.reply(`✅ Bot instance created successfully!\n\nUse !stopjadibot to stop your bot instance.`);
      logger.info(`JadiBot created for ${userId}`);
    } catch (error: any) {
      logger.error('Error in jadibot command:', error);

      if (error.message.includes('Rate limit')) {
        await ctx.reply('Rate limit exceeded. Please wait before creating new bot.');
      } else if (error.message.includes('already have an active bot')) {
        await ctx.reply(
          'You already have an active bot instance!\nUse !stopjadibot to stop your current bot.'
        );
      } else if (error.message.includes('requires premium')) {
        await ctx.reply('This feature requires premium access.');
      } else {
        await ctx.reply(`Terjadi kesalahan saat membuat bot instance: ${error.message}`);
      }
    }
  },
};

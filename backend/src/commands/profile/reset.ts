import { MessageContext, GlobalContext } from '../../types/index.js';

export default {
  name: 'reset',
  category: 'profile',
  permissions: {
    private: true,
  },
  code: async (ctx: MessageContext) => {
    const { formatter, config, databaseService } = ctx.bot.context as GlobalContext;

    try {
      const confirmation = ctx.args[0]?.toLowerCase();

      if (confirmation !== 'confirm') {
        return await ctx.reply(
          formatter.quote(
            `🤖 Warning: This will delete ALL your saved data.\n\nTo confirm, please type:\n${formatter.monospace(`${ctx.prefix}reset confirm`)}`
          )
        );
      }

      const senderId = ctx.sender.jid; // Use correct property

      // Access deleteUser from the service directly or via the context adapter if available
      // Based on context.ts, 'databaseService' is the instance with full methods
      if (databaseService && databaseService.deleteUser) {
        await databaseService.deleteUser(senderId);
        await ctx.reply(formatter.quote('✅ User data has been successfully reset.'));
      } else {
        // Fallback if databaseService isn't typed or available as expected, though context.ts puts it there
        await ctx.reply(formatter.quote('❌ Database service not available.'));
      }

    } catch (error: any) {
      await ctx.reply(formatter.quote(`Error: ${error.message}`));
    }
  },
};

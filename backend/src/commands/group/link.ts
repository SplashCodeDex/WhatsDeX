import { MessageContext } from '../../types/index.js';
export default {
  name: 'link',
  aliases: ['gclink', 'grouplink'],
  category: 'group',
  permissions: {
    botAdmin: true,
    group: true,
  },
  code: async (ctx: MessageContext) => {
    const { formatter, tools } = ctx.bot.context;
    try {
      const code = await ctx.group().inviteCode();

      await ctx.reply(formatter.quote(`https://chat.whatsapp.com/${code}`));
    } catch (error: any) {
      await tools.cmd.handleError(ctx, error);
    }
  },
};

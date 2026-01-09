import { MessageContext } from '../../types/index.js';
export default {
  name: 'hidetag',
  aliases: ['ht'],
  category: 'group',
  permissions: {
    admin: true,
    group: true,
  },
  code: async (ctx: MessageContext) => {
    const { formatter, tools } = ctx.bot.context;
    const input = ctx.args.join(' ') || ctx.quoted?.content || formatter.quote('👋 Halo, Dunia!');

    try {
      const members = await ctx.group().members();
      const mentions = members.map(member => member.jid);

      await ctx.reply({
        text: input,
        mentions,
      });
    } catch (error: any) {
      await tools.cmd.handleError(ctx, error);
    }
  },
};

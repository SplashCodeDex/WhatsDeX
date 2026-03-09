import { MessageContext } from '../../types/index.js';
export default {
  name: 'otagall',
  category: 'owner',
  permissions: {
    group: true,
    owner: true,
  },
  code: async (ctx: MessageContext) => {
    const { formatter, tools, config } = ctx.channel.context;
    const input = ctx.args.join(' ') || ctx.quoted?.content || formatter.quote('👋 Halo, Dunia!');

    try {
      const mentions = await ctx.group().members();
      const resultText = mentions.map(jid => `@${ctx.getId(jid)}`).join(' ');

      await ctx.reply({
        text: `${input}\n` + `${config.msg.readmore}· · ─ ·✶· ─ · ·\n${resultText}`,
        mentions,
      });
    } catch (error: any) {
      await tools.cmd.handleError(ctx, error);
    }
  },
};

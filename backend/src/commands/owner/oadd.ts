import { MessageContext, GlobalContext } from '../../types/index.js';

export default {
  name: 'oadd',
  category: 'owner',
  permissions: {
    channelAdmin: true,
    group: true,
    owner: true,
    restrict: true,
  },
  code: async (ctx: MessageContext) => {
    const { formatter, tools } = ctx.channel.context as GlobalContext;
    const input = ctx.args.join(' ') || null;

    if (!input) {
      const instruction = tools.msg.generateInstruction(['send'], ['text']);
      const example = tools.msg.generateCmdExample(ctx.used, ctx.getId(ctx.sender.jid));
      return await ctx.reply(`${formatter.quote(instruction)}
${formatter.quote(example)}`);
    }

    const accountJid = `${input.replace(/\D/g, '')}@s.whatsapp.net`;

    // Assuming ctx.core exists on Bot or similar, might need adjustment based on actual library usage
    // Using simple check for now or skipping if method not available on type
    // const isOnWhatsApp = await ctx.core.onWhatsApp(accountJid);
    // if (isOnWhatsApp.length === 0)
    //   return await ctx.reply(formatter.quote('❎ Akun tidak ada di WhatsApp!'));

    try {
      await ctx.group().add([accountJid]); // Pass as array

      await ctx.reply(formatter.quote('✅ Berhasil ditambahkan!'));
    } catch (error: unknown) {
      await tools.cmd.handleError(ctx, error);
    }
  },
};

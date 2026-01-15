import { MessageContext, GlobalContext } from '../../types/index.js';

export default {
  name: 'ounmute',
  category: 'owner',
  permissions: {
    group: true,
    owner: true,
  },
  code: async (ctx: MessageContext) => {
    const { formatter, tools, config, database: db } = ctx.bot.context as GlobalContext;
    const groupId = ctx.getId(ctx.id);

    if (ctx.args[0]?.toLowerCase() === 'bot') {
      await db.set(`group.${groupId}.mutebot`, false);
      return await ctx.reply(formatter.quote('✅ Berhasil me-unmute grup ini dari bot!'));
    }

    const accountJid = ctx.quoted?.senderJid || (ctx.getMentioned ? (await ctx.getMentioned())[0] : null) || null;
    if (!accountJid) {
      const instruction = tools.msg.generateInstruction(['send'], ['text']);
      const example = tools.msg.generateCmdExample(ctx.used, `@${ctx.getId(ctx.sender.jid)}`);
      const notes = tools.msg.generateNotes([
        'Balas atau kutip pesan untuk menjadikan pengirim sebagai akun target.',
        `Ketik ${formatter.inlineCode(`${ctx.used.prefix + ctx.used.command} bot`)} untuk me-unmute bot.`,
      ]);
      return await ctx.reply({
        text: `${formatter.quote(instruction)}
${formatter.quote(example)}
${formatter.quote(notes)}`,
        mentions: [ctx.sender.jid],
      });
    }

    const accountId = ctx.getId(accountJid);

    if (accountId === config.bot.id)
      return await ctx.reply(
        formatter.quote(
          `❎ Ketik ${formatter.inlineCode(`${ctx.used.prefix + ctx.used.command} bot`)} untuk me-unmute bot.`
        )
      );
    if (await ctx.group().isOwner(accountJid))
      return await ctx.reply(formatter.quote('❎ Dia adalah owner grup!'));

    try {
      let muteList: string[] = (await db.get(`group.${groupId}.mute`)) || [];
      muteList = muteList.filter((mute: string) => mute !== accountId);
      await db.set(`group.${groupId}.mute`, muteList);

      await ctx.reply(formatter.quote('✅ Berhasil me-unmute pengguna itu dari grup ini!'));
    } catch (error: unknown) {
      await tools.cmd.handleError(ctx, error);
    }
  },
};

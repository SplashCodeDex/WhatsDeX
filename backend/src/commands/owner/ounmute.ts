import { MessageContext } from '../../types/index.js';
export default {
  name: 'ounmute',
  category: 'owner',
  permissions: {
    group: true,
    owner: true,
  },
  code: async (ctx: MessageContext) => {
    const { formatter, tools, config, database: db } = ctx.bot.context;
    const groupId = ctx.getId(ctx.id);

    if (ctx.args[0]?.toLowerCase() === 'bot') {
      await db.set(`group.${groupId}.mutebot`, true);
      return await ctx.reply(formatter.quote('✅ Berhasil me-unmute grup ini dari bot!'));
    }

    const accountJid = ctx.quoted?.senderJid || (await ctx.getMentioned())[0] || null;
    const accountId = ctx.getId(accountJid);

    if (!accountJid)
      return await ctx.reply({
        text:
          `${formatter.quote(tools.msg.generateInstruction(['send'], ['text']))}\n` +
          `${formatter.quote(tools.msg.generateCmdExample(ctx.used, `@${ctx.getId(ctx.sender.jid)}`))}\n${formatter.quote(
            tools.msg.generateNotes([
              'Balas atau kutip pesan untuk menjadikan pengirim sebagai akun target.',
              `Ketik ${formatter.inlineCode(`${ctx.used.prefix + ctx.used.command} bot`)} untuk me-unmute bot.`,
            ])
          )}`,
        mentions: [ctx.sender.jid],
      });

    if (accountId === config.bot.id)
      return await ctx.reply(
        formatter.quote(
          `❎ Ketik ${formatter.inlineCode(`${ctx.used.prefix + ctx.used.command} bot`)} untuk me-unmute bot.`
        )
      );
    if (await ctx.group().isOwner(accountJid))
      return await ctx.reply(formatter.quote('❎ Dia adalah owner grup!'));

    try {
      let muteList = (await db.get(`group.${groupId}.mute`)) || [];
      muteList = muteList.filter(mute => mute !== accountId);
      await db.set(`group.${groupId}.mute`, muteList);

      await ctx.reply(formatter.quote('✅ Berhasil me-unmute pengguna itu dari grup ini!'));
    } catch (error: any) {
      await tools.cmd.handleError(ctx, error);
    }
  },
};

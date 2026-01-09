import { MessageContext } from '../../types/index.js';

export default {
  name: 'addsewagroup',
  aliases: ['addsewa', 'addsewagrup', 'adg'],
  category: 'owner',
  permissions: {
    owner: true,
  },
  code: async (ctx: MessageContext) => {
    const { formatter, tools, database: db } = ctx.bot.context;
    const groupJid = ctx.isGroup()
      ? ctx.id
      : ctx.args[0]
        ? `${ctx.args[0].replace(/[^\d]/g, '')}@g.us`
        : null;
    const daysAmount = parseInt(ctx.args[ctx.isGroup() ? 0 : 1], 10) || null;

    if (!groupJid)
      return await ctx.reply(
        `${formatter.quote(tools.msg.generateInstruction(['send'], ['text']))}\n` +
        `${formatter.quote(tools.msg.generateCmdExample(ctx.used, '1234567890 30'))}\n` +
        `${formatter.quote(tools.msg.generateNotes(['Gunakan di grup untuk otomatis menyewakan grup tersebut.']))}\n${formatter.quote(
          tools.msg.generatesFlagInfo({
            '-s': 'Tetap diam dengan tidak menyiarkan ke orang yang relevan',
          })
        )}`
      );

    if (!(await ctx.group(groupJid)))
      return await ctx.reply(
        formatter.quote('❎ Grup tidak valid atau bot tidak ada di grup tersebut!')
      );

    try {
      const groupId = ctx.getId(groupJid);
      await db.set(`group.${groupId}.sewa`, true);

      const flag = tools.cmd.parseFlag(ctx.args.join(' '), {
        '-s': {
          type: 'boolean',
          key: 'silent',
        },
      });

      const silent = flag?.silent || false;
      const group = await ctx.group(groupJid);
      const groupOwner = await group.owner();
      const groupName = await group.name();

      if (daysAmount && daysAmount > 0) {
        const expirationDate = Date.now() + daysAmount * 24 * 60 * 60 * 1000;
        await db.set(`group.${groupId}.sewaExpiration`, expirationDate);

        if (!silent && groupOwner) {
          await ctx.sendMessage(groupOwner, {
            text: formatter.quote(
              `📢 Bot berhasil disewakan ke grup ${groupName} (@${groupJid}) selama ${daysAmount} hari!`
            ),
          });
        }

        await ctx.reply(
          formatter.quote(
            `✅ Berhasil menyewakan bot ke grup ${ctx.isGroup() ? 'ini' : 'itu'} selama ${daysAmount} hari!`
          )
        );
      } else {
        await db.delete(`group.${groupId}.sewaExpiration`);

        if (!silent && groupOwner) {
          await ctx.sendMessage(groupOwner, {
            text: formatter.quote(
              `📢 Bot berhasil disewakan ke grup ${groupName} (@${groupJid}) selamanya!`
            ),
          });
        }

        await ctx.reply(
          formatter.quote(
            `✅ Berhasil menyewakan bot ke grup ${ctx.isGroup() ? 'ini' : 'itu'} selamanya!`
          )
        );
      }
    } catch (error: any) {
      await tools.cmd.handleError(ctx, error);
    }
  },
};

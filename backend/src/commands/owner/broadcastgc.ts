import { MessageContext, GlobalContext } from '../../types/index.js';

export default {
  name: 'broadcastgc',
  aliases: ['bc', 'bcgc', 'broadcast'],
  category: 'owner',
  permissions: {
    owner: true,
  },
  code: async (ctx: MessageContext) => {
    const { formatter, tools, config, database: db } = ctx.bot.context as GlobalContext;
    const input = ctx.args.join(' ') || (ctx.quoted as any)?.content || null;

    if (!input) {
      const instruction = tools.msg.generateInstruction(['send'], ['text']);
      const example = tools.msg.generateCmdExample(ctx.used, 'halo, dunia!');
      return await ctx.reply(
        `${formatter.quote(instruction)}
${formatter.quote(example)}`
      );
    }

    if (ctx.args[0]?.toLowerCase() === 'blacklist' && ctx.isGroup()) {
      const blacklist = (await db.get('bot.blacklistBroadcast')) || [];
      const groupIndex = blacklist.indexOf(ctx.id);

      if (groupIndex > -1) {
        blacklist.splice(groupIndex, 1);
        await db.set('bot.blacklistBroadcast', blacklist);
        return await ctx.reply(formatter.quote('✅ Grup ini telah dihapus dari blacklist broadcast'));
      }

      blacklist.push(ctx.id);
      await db.set('bot.blacklistBroadcast', blacklist);
      return await ctx.reply(formatter.quote('✅ Grup ini telah ditambahkan ke blacklist broadcast'));
    }

    try {
      const groups = ctx.bot.groupFetchAllParticipating ? await ctx.bot.groupFetchAllParticipating() : {};
      const groupIds = Object.values(groups).map((group: any) => group.id as string);

      const blacklist = (await db.get('bot.blacklistBroadcast')) || [];
      const filteredGroupIds = groupIds.filter((groupId: string) => !blacklist.includes(groupId));

      const waitMsg = await ctx.reply(
        formatter.quote(
          `🔄 Mengirim siaran ke ${filteredGroupIds.length} grup, perkiraan waktu: ${formatter.convertMsToDuration(filteredGroupIds.length * 500)}`
        )
      );

      const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
      const failedGroupIds: string[] = [];

      for (const groupId of filteredGroupIds) {
        await delay(500);
        try {
          await ctx.bot.sendMessage(groupId, { text: input });
        } catch (error: unknown) {
          failedGroupIds.push(groupId);
        }
      }

      const successCount = filteredGroupIds.length - failedGroupIds.length;

      if (ctx.editMessage && waitMsg?.key) {
        await ctx.editMessage(
          waitMsg.key,
          formatter.quote(
            `✅ Berhasil mengirim ke ${successCount} grup. Gagal mengirim ke ${failedGroupIds.length} grup.`
          )
        );
      }
    } catch (error: unknown) {
      await tools.cmd.handleError(ctx, error);
    }
  },
};

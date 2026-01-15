import { MessageContext, GlobalContext } from '../../types/index.js';
import { convertMsToDuration } from '../../utils/formatters.js';

export default {
  name: 'broadcasttagsw',
  aliases: ['bctagsw'],
  category: 'owner',
  permissions: {
    owner: true,
  },
  code: async (ctx: MessageContext) => {
    const { formatter, tools, database: db } = ctx.bot.context as GlobalContext;
    const input = ctx.args.join(' ') || (ctx.quoted as any)?.content || null;

    if (!input) {
      return await ctx.reply(formatter.quote('Please provide a caption/message.'));
    }

    const [checkMedia, checkQuotedMedia] = await Promise.all([
      tools.cmd.checkMedia(ctx.msg.contentType, ['image', 'gif', 'video']),
      tools.cmd.checkQuotedMedia(ctx.quoted?.contentType, ['image', 'gif', 'video']),
    ]);

    if (!checkMedia && !checkQuotedMedia) {
      return await ctx.reply(formatter.quote('Please send or reply to an image/video.'));
    }

    try {
      const groups = await (ctx as any).core.groupFetchAllParticipating();
      const groupIds = Object.values(groups).map((group: any) => group.id as string);

      const blacklist = (await db.get<string[]>('bot.blacklistBroadcast')) || [];
      const filteredGroupIds = groupIds.filter((groupId: string) => !blacklist.includes(groupId));

      const waitMsg = await ctx.reply(
        formatter.quote(
          `🔄 Mengirim siaran ke ${filteredGroupIds.length} grup, perkiraan waktu: ${convertMsToDuration(filteredGroupIds.length * 500)}`
        )
      );

      const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
      const failedGroupIds: string[] = [];

      const mediaType = checkMedia || checkQuotedMedia;
      // Note: In real implementation, buffer logic should be robust
      const buffer = await (ctx.msg as any).media?.toBuffer() || await (ctx.quoted as any)?.media?.toBuffer();

      for (const groupId of filteredGroupIds) {
        await delay(500);
        try {
          await (ctx as any).core.sendStatusMentions(groupId, {
            [mediaType]: buffer,
            caption: input,
          });
        } catch (error: unknown) {
          failedGroupIds.push(groupId);
        }
      }

      const successCount = filteredGroupIds.length - failedGroupIds.length;

      await (ctx as any).editMessage(
        waitMsg.key,
        formatter.quote(
          `✅ Berhasil mengirim ke ${successCount} grup. Gagal mengirim ke ${failedGroupIds.length} grup.`
        )
      );
    } catch (error: unknown) {
      await tools.cmd.handleError(ctx, error);
    }
  },
};

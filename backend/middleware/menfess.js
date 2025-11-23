import { S_WHATSAPP_NET } from '@whiskeysockets/baileys';

export default async (ctx, context) => {
  const { database, formatter } = context;
  const { isPrivate, sender, isCmd, msg, m } = ctx;

  if (isPrivate) {
    const allMenfessDb = await database.getAllMenfess();
    if (!isCmd || isCmd?.didyoumean) {
      for (const [menfessId, { from, to }] of Object.entries(allMenfessDb)) {
        if (sender.id === from || sender.id === to) {
          const targetId = sender.id === from ? to : from + S_WHATSAPP_NET;
          if (m.content === 'delete') {
            const replyText = formatter.quote('✅ Menfess session has been deleted!');
            await ctx.reply(replyText);
            await ctx.sendMessage(targetId, {
              text: replyText,
            });
            await database.menfess.delete(menfessId);
          } else {
            await ctx.forwardMessage(targetId, msg);
          }
        }
      }
    }
  }

  return true;
};

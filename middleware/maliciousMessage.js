import { analyzeMessage } from 'guaranteed_security';
import { S_WHATSAPP_NET } from '@whiskeysockets/baileys';

export default async (ctx, context) => {
  const { database, formatter, config } = context;
  const { sender, msg } = ctx;

  const analyze = analyzeMessage(msg.message);
  if (analyze.isMalicious) {
    await ctx.deleteMessage(msg.key);
    await ctx.block(sender.jid);
    await database.user.update(sender.id, { banned: true });

    await ctx.sendMessage(config.owner.id + S_WHATSAPP_NET, {
      text: `📢 Account @${sender.id} has been automatically blocked for the reason ${formatter.inlineCode(analyze.reason)}.`,
      mentions: [sender.jid],
    });
    return false;
  }

  return true;
};

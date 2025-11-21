export default async (ctx, context) => {
  const {
    tools: { warn },
    formatter,
  } = context;
  const { isGroup, isOwner, isAdmin, groupDb, sender, msg, m } = ctx;

  if (isGroup && !isOwner && !isAdmin) {
    if (groupDb?.option?.antitoxic) {
      const toxicRegex =
        /anj(k|g)|ajn?(g|k)|a?njin(g|k)|bajingan|b(a?n)?gsa?t|ko?nto?l|me?me?(k|q)|pe?pe?(k|q)|meki|titi(t|d)|pe?ler|tetek|toket|ngewe|go?blo?k|to?lo?l|idiot|(k|ng)e?nto?(t|d)|jembut|bego|dajj?al|janc(u|o)k|pantek|puki ?(mak)?|kimak|kampang|lonte|col(i|mek?)|pelacur|henceu?t|nigga|fuck|dick|bitch|tits|bastard|asshole|dontol|kontoi|ontol/i;
      if (m.content && toxicRegex.test(m.content)) {
        await ctx.reply(formatter.quote('⛔ Jangan toxic!'));
        await ctx.deleteMessage(msg.key);
        if (groupDb?.option?.autokick) {
          await ctx.group().kick(sender.jid);
        } else {
          await warn.addWarning(ctx, groupDb, sender.jid, ctx.getId(ctx.id));
        }
        return false;
      }
    }
  }

  return true;
};

module.exports = async (ctx, context) => {
  const { database, tools, formatter } = context;
  const { isGroup, sender, userDb } = ctx;

  // Handle user coming back from AFK
  const userAfk = userDb?.afk || {};
  if (userAfk.reason || userAfk.timestamp) {
    const timeElapsed = Date.now() - userAfk.timestamp;
    if (timeElapsed > 3000) {
      const timeago = tools.msg.convertMsToDuration(timeElapsed);
      await ctx.reply(
        formatter.quote(
          `📴 Kamu telah keluar dari AFK ${userAfk.reason ? `dengan alasan ${formatter.inlineCode(userAfk.reason)}` : 'tanpa alasan'} selama ${timeago}.`
        )
      );
      const { afk, ...rest } = userDb;
      await database.user.set(sender.id, rest);
    }
  }

  // Handle mentioning AFK users
  if (isGroup) {
    const userAfkMentions = ctx.quoted?.senderJid
      ? [ctx.getId(ctx.quoted.senderJid)]
      : (await ctx.getMentioned()).map(jid => ctx.getId(jid));
    if (userAfkMentions.length > 0) {
      for (const userAfkMention of userAfkMentions) {
        const mentionedUser = await database.user.get(userAfkMention);
        const mentionedUserAfk = mentionedUser?.afk || {};
        if (mentionedUserAfk.reason || mentionedUserAfk.timestamp) {
          const timeago = tools.msg.convertMsToDuration(Date.now() - mentionedUserAfk.timestamp);
          await ctx.reply(
            formatter.quote(
              `📴 Jangan tag! Dia sedang AFK ${mentionedUserAfk.reason ? `dengan alasan ${formatter.inlineCode(mentionedUserAfk.reason)}` : 'tanpa alasan'} selama ${timeago}.`
            )
          );
        }
      }
    }
  }

  return true;
};

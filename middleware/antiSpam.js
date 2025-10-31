module.exports = async (ctx, context) => {
  const {
    database,
    tools: { warn },
    formatter,
  } = context;
  const { isGroup, isOwner, isAdmin, groupDb, sender, msg } = ctx;

  if (isGroup && !isOwner && !isAdmin) {
    if (groupDb?.option?.antispam) {
      const now = Date.now();
      const spamData = groupDb.spam || [];

      const userSpam = spamData.find(spam => spam.userId === sender.id) || {
        userId: sender.id,
        count: 0,
        lastMessageTime: 0,
      };

      const timeDiff = now - userSpam.lastMessageTime;
      const newCount = timeDiff < 5000 ? userSpam.count + 1 : 1;

      userSpam.count = newCount;
      userSpam.lastMessageTime = now;

      if (!spamData.some(spam => spam.userId === sender.id)) spamData.push(userSpam);

      await database.group.update(ctx.getId(ctx.id), { spam: spamData });

      if (newCount > 5) {
        await ctx.reply(formatter.quote('⛔ Jangan spam, ngelag woy!'));
        await ctx.deleteMessage(msg.key);
        if (groupDb?.option?.autokick) {
          await ctx.group().kick(sender.jid);
        } else {
          await warn.addWarning(ctx, groupDb, sender.jid, ctx.getId(ctx.id));
        }
        await database.group.update(ctx.getId(ctx.id), {
          spam: spamData.filter(spam => spam.userId !== sender.id),
        });
        return false;
      }
    }
  }

  return true;
};

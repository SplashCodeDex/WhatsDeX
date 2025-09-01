module.exports = async (ctx) => {
    const { tools: { cmd, warn }, formatter } = ctx.self.context;
    const { isGroup, isOwner, isAdmin, groupDb, sender, msg, m } = ctx;

    if (isGroup && !isOwner && !isAdmin) {
        if (groupDb?.option?.antilink && m.content && cmd.isUrl(m.content)) {
            await ctx.reply(formatter.quote("⛔ Jangan kirim link!"));
            await ctx.deleteMessage(msg.key);
            if (groupDb?.option?.autokick) {
                await ctx.group().kick(sender.jid);
            } else {
                await warn.addWarning(ctx, groupDb, sender.jid, ctx.getId(ctx.id));
            }
            return false;
        }
    }

    return true;
};

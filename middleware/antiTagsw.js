module.exports = async (ctx) => {
    const { tools: { cmd, warn }, formatter } = ctx.self.context;
    const { isGroup, isOwner, isAdmin, groupDb, sender, msg, m } = ctx;

    if (isGroup && !isOwner && !isAdmin) {
        if (groupDb?.option?.antitagsw) {
            const checkMedia = cmd.checkMedia(ctx.getMessageType(), "groupStatusMention") || m.message?.groupStatusMentionMessage?.protocolMessage?.type === 25;
            if (checkMedia) {
                await ctx.reply(formatter.quote(`⛔ Jangan tag grup di SW, gak ada yg peduli!`));
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

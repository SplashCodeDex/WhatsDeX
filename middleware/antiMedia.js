module.exports = async (ctx, context) => {
    const { tools: { cmd, warn }, formatter } = context;
    const { isGroup, isOwner, isAdmin, groupDb, sender, msg } = ctx;

    if (isGroup && !isOwner && !isAdmin) {
        for (const type of ["audio", "document", "gif", "image", "sticker", "video"]) {
            if (groupDb?.option?.[`anti${type}`]) {
                const checkMedia = cmd.checkMedia(ctx.getMessageType(), type);
                if (checkMedia) {
                    await ctx.reply(formatter.quote(`⛔ Jangan kirim ${type}!`));
                    await ctx.deleteMessage(msg.key);
                    if (groupDb?.option?.autokick) {
                        await ctx.group().kick(sender.jid);
                    } else {
                        await warn.addWarning(ctx, groupDb, sender.jid, ctx.getId(ctx.id));
                    }
                    return false; // Stop processing further
                }
            }
        }
    }

    return true;
};

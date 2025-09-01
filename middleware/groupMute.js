module.exports = async (ctx) => {
    const { isGroup, sender, isOwner, isAdmin, groupDb } = ctx;

    if (isGroup) {
        if (groupDb?.mutebot === true && !isOwner && !isAdmin) return false;
        if (groupDb?.mutebot === "owner" && !isOwner) return false;
        const muteList = groupDb?.mute || [];
        if (muteList.includes(sender.id)) {
            await ctx.deleteMessage(ctx.msg.key);
            return false;
        }
    }

    return true;
};

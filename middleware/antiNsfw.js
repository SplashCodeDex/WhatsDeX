const axios = require("axios");
const { Baileys } = require("@itsreimau/gktw");

module.exports = async (ctx, context) => {
    const { tools: { cmd, api, warn }, formatter } = context;
    const { isGroup, isOwner, isAdmin, groupDb, sender, msg } = ctx;

    if (isGroup && !isOwner && !isAdmin) {
        if (groupDb?.option?.antinsfw) {
            const checkMedia = cmd.checkMedia(ctx.getMessageType(), "image");
            if (checkMedia) {
                const buffer = await msg.media.toBuffer();
                const uploadUrl = await Baileys.uploadFile(buffer);
                const apiUrl = api.createUrl("neko", "/tools/nsfw-checker", {
                    imageUrl: uploadUrl
                });
                const result = (await axios.get(apiUrl)).data.result.labelName.toLowerCase();

                if (result.nsfw === "porn") {
                    await ctx.reply(formatter.quote("⛔ Jangan kirim NSFW, dasar cabul!"));
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
    }

    return true;
};

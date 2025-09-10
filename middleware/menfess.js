const { S_WHATSAPP_NET } = require("@whiskeysockets/baileys");

module.exports = async (ctx, context) => {
    const { database, formatter } = context;
    const { isPrivate, sender, isCmd, msg, m } = ctx;

    if (isPrivate) {
        const allMenfessDb = await database.menfess.getAll();
        if (!isCmd || isCmd?.didyoumean) {
            for (const [menfessId, { from, to }] of Object.entries(allMenfessDb)) {
                if (sender.id === from || sender.id === to) {
                    const targetId = sender.id === from ? to : from + S_WHATSAPP_NET;
                    if (m.content === "delete") {
                        const replyText = formatter.quote("✅ Menfess session has been deleted!");
                        await ctx.reply(replyText);
                        await ctx.sendMessage(targetId, {
                            text: replyText
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

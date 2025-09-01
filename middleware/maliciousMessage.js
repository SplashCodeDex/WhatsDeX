const { analyzeMessage } = require("guaranteed_security");

module.exports = async (ctx) => {
    const { database, formatter, config } = ctx.self.context;
    const { sender, msg } = ctx;

    const analyze = analyzeMessage(msg.message);
    if (analyze.isMalicious) {
        await ctx.deleteMessage(msg.key);
        await ctx.block(sender.jid);
        await database.user.update(sender.id, { banned: true });

        await ctx.sendMessage(config.owner.id + require("@itsreimau/gktw").Baileys.S_WHATSAPP_NET, {
            text: `📢 Akun @${sender.id} telah diblokir secara otomatis karena alasan ${formatter.inlineCode(analyze.reason)}.`,
            mentions: [sender.jid]
        });
        return false;
    }

    return true;
};

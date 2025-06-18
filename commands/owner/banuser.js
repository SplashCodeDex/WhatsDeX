const {
    quote
} = require("@itsreimau/ckptw-mod");

module.exports = {
    name: "banuser",
    aliases: ["ban", "bu"],
    category: "owner",
    permissions: {
        owner: true
    },
    code: async (ctx) => {
        const userJid = ctx.quoted.senderJid || ctx.msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || (ctx.args[0] ? `${ctx.args[0].replace(/[^\d]/g, "")}@s.whatsapp.net` : null);

        if (!userJid) return await ctx.reply({
            text: `${quote(tools.msg.generateInstruction(["send"], ["text"]))}\n` +
                `${quote(tools.msg.generateCmdExample(ctx.used, `@${ctx.getId(ctx.sender.jid)}`))}\n` +
                quote(tools.msg.generateNotes(["Balas atau kutip pesan untuk menjadikan pengirim sebagai akun target."])),
            mentions: [ctx.sender.jid]
        });

        const isOnWhatsApp = await ctx.core.onWhatsApp(userJid);
        if (isOnWhatsApp.length === 0) return await ctx.reply(quote("❎ Akun tidak ada di WhatsApp!"));

        try {
            await db.set(`user.${ctx.getId(userJid)}.banned`, true);

            await ctx.sendMessage(userJid, {
                text: quote("🎉 Kamu telah dibanned oleh Owner!")
            });
            return await ctx.reply(quote("✅ Berhasil dibanned!"));
        } catch (error) {
            return await tools.cmd.handleError(ctx, error);
        }
    }
};
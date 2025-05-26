const {
    quote
} = require("@itsreimau/ckptw-mod");

module.exports = {
    name: "delpremuser",
    aliases: ["delprem", "dpu"],
    category: "owner",
    permissions: {
        owner: true
    },
    code: async (ctx) => {
        const userJid = ctx.quoted.senderJid || ctx.msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || (ctx.args[0] ? `${ctx.args[0]}@s.whatsapp.net` : null);

        if (!userJid) return await ctx.reply({
            text: `${quote(tools.cmd.generateInstruction(["send"], ["text"]))}\n` +
                `${quote(tools.cmd.generateCommandExample(ctx.used, `@${tools.general.getID(ctx.sender.jid)}`))}\n` +
                quote(tools.cmd.generateNotes(["Balas atau kutip pesan untuk menjadikan pengirim sebagai akun target."])),
            mentions: [ctx.sender.jid]
        });

        const [isOnWhatsApp] = await ctx.core.onWhatsApp(userJid);
        if (!isOnWhatsApp.exists) return await ctx.reply(quote("❎ Akun tidak ada di WhatsApp!"));

        try {
            await db.set(`user.${tools.general.getID(userJid)}.premium`, false);

            await ctx.sendMessage(userJid, {
                text: quote("🎉 Anda telah dihapus sebagai pengguna Premium oleh Owner!")
            });
            return await ctx.reply(quote("✅ Berhasil dihapus sebagai pengguna Premium!"));
        } catch (error) {
            return await tools.cmd.handleError(ctx, error, false);
        }
    }
};
const {
    quote
} = require("@mengkodingan/ckptw");
const {
    jidDecode,
    jidEncode,
    S_WHATSAPP_NET
} = require("@whiskeysockets/baileys");

module.exports = {
    name: "delprem",
    aliases: ["delpremuser"],
    category: "owner",
    handler: {
        owner: true
    },
    code: async (ctx) => {
        const {
            status,
            message
        } = await global.handler(ctx, module.exports.handler);
        if (status) return ctx.reply(message);

        const userId = ctx.args[0];

        const senderJidDecode = await jidDecode(ctx.sender.jid);
        const senderJid = await jidEncode(senderJidDecode.user, senderJidDecode.server);
        const senderNumber = senderJidDecode.user;
        const mentionedJids = ctx.msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        const user = Array.isArray(mentionedJids) && mentionedJids.length > 0 ? mentionedJids[0] : jidEncode(userId, S_WHATSAPP_NET);

        if (!ctx.args.length && !user) return ctx.reply({
            text: `${quote(global.tools.msg.generateInstruction(["send"], ["text"]))}\n` +
                quote(global.tools.msg.generateCommandExample(ctx._used.prefix + ctx._used.command, `@${senderNumber}`)),
            mentions: [senderJid]
        });

        try {
            const [result] = await ctx._client.onWhatsApp(user);
            if (!result.exists) return ctx.reply(quote(`❎ Akun tidak ada di WhatsApp.`));

            const userDecode = await jidDecode(user);
            await global.db.set(`user.${jidDecode.user}.isPremium`, false);

            ctx.sendMessage(user, {
                text: quote(`🎉 Anda telah dihapus sebagai pengguna Premium oleh Owner!`)
            });
            return ctx.reply(quote(`✅ Berhasil dihapus sebagai pengguna Premium!`));
        } catch (error) {
            console.error(`[${global.config.pkg.name}] Error:`, error);
            return ctx.reply(quote(`❎ Terjadi kesalahan: ${error.message}`));
        }
    }
};
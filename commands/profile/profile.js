const {
    quote
} = require("@mengkodingan/ckptw");
const {
    jidDecode,
    jidEncode
} = require("@whiskeysockets/baileys");
const mime = require("mime-types");

module.exports = {
    name: "profile",
    category: "profile",
    handler: {
        banned: true,
        cooldown: true
    },
    code: async (ctx) => {
        const {
            status,
            message
        } = await global.handler(ctx, module.exports.handler);
        if (status) return ctx.reply(message);

        try {
            const senderJidDecode = jidDecode(ctx.sender.jid);
            const senderJid = jidEncode(senderJidDecode.user, senderJidDecode.server);
            const senderNumber = senderJidDecode.user;
            const senderName = ctx.sender.pushName || "-";

            const [userCoin = 0, isPremium, userXp = 0, userLevel = 1, isOwner] = await Promise.all([
                global.db.get(`user.${senderNumber}.coin`),
                global.db.get(`user.${senderNumber}.isPremium`),
                global.db.get(`user.${senderNumber}.xp`),
                global.db.get(`user.${senderNumber}.level`),
                global.tools.general.isOwner(ctx, senderNumber, true),
            ]);

            const userStatus = isOwner ? "Owner" : (isPremium ? "Premium" : "Freemium");

            let profilePictureUrl;
            try {
                profilePictureUrl = await ctx._client.profilePictureUrl(senderJid, "image");
            } catch (error) {
                profilePictureUrl = global.config.bot.picture.profile;
            }
            const card = global.tools.api.createUrl("aggelos_007", "/rankcard", {
                username: senderName,
                xp: userXp,
                maxxp: "100",
                level: userLevel,
                avatar: profilePictureUrl,
            });

            return await ctx.reply({
                image: {
                    url: card || profilePictureUrl,
                },
                mimetype: mime.contentType("png"),
                caption: `${quote(`Nama: ${senderName}`)}\n` +
                    `${quote(`Status: ${userStatus}`)}\n` +
                    `${quote(`Level: ${userLevel}`)}\n` +
                    `${quote(`Koin: ${userCoin || "-"}`)}\n` +
                    `${quote(`XP: ${userXp}`)}\n` +
                    "\n" +
                    global.config.msg.footer,
            });
        } catch (error) {
            console.error(`[${global.config.pkg.name}] Error:`, error);
            return ctx.reply(quote(`❎ Terjadi kesalahan: ${error.message}`));
        }
    },
};
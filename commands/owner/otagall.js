const {
    quote
} = require("@mengkodingan/ckptw");
const {
    jidDecode,
    jidEncode,
    _WHATSAPP_NET
} = require("@whiskeysockets/baileys");

module.exports = {
    name: "otagall",
    category: "owner",
    handler: {
        group: true,
        owner: true
    },
    code: async (ctx) => {
        const {
            status,
            message
        } = await global.handler(ctx, module.exports.handler);
        if (status) return ctx.reply(message);

        const input = ctx.args.join(" ") || null;

        try {
            const data = await ctx.group().members();
            const len = data.length;
            const mentions = [];
            for (let i = 0; i < len; i++) {
                const idDecode = await jidDecode(data[i].id);
                const tag = idDecode.user;
                const mention = jidEncode(idDecode.user + idDecode.server);
                mentions.push({
                    tag,
                    mention
                });
            }
            const mentionText = mentions.map((mention) => mention.tag).join(" ");

            return ctx.reply({
                text: `${input || "Hai!"}\n` +
                    `-----\n` +
                    `${mentionText}`,
                mentions: mentions.map((mention) => mention.mention)
            });
        } catch (error) {
            console.error(`[${global.config.pkg.name}] Error:`, error);
            return ctx.reply(quote(`❎ Terjadi kesalahan: ${error.message}`));
        }
    }
};
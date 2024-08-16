const {
    bold,
    quote
} = require("@mengkodingan/ckptw");
const {
    S_WHATSAPP_NET
} = require("@whiskeysockets/baileys");

module.exports = {
    name: "tagall",
    category: "group",
    code: async (ctx) => {
        const {
            status,
            message
        } = await global.handler(ctx, {
            admin: true,
            banned: true,
            group: true
        });
        if (status) return ctx.reply(message);

        const input = ctx._args.join(" ") || null;

        try {
            const data = await ctx.group().members();
            const len = data.length;
            const mentions = [];
            for (let i = 0; i < len; i++) {
                const serialized = data[i].id.split("@")[0];
                mentions.push({
                    tag: `@${serialized}`,
                    mention: serialized + S_WHATSAPP_NET
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
            console.error("Error:", error);
            return ctx.reply(quote(`${bold("[ ! ]")} Terjadi kesalahan: ${error.message}`));
        }
    }
};
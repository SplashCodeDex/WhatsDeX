const {
    bold,
    quote
} = require("@mengkodingan/ckptw");
const axios = require("axios");
const mime = require("mime-types");

module.exports = {
    name: "googleimage",
    aliases: ["gimage"],
    category: "internet",
    code: async (ctx) => {
        const {
            status,
            message
        } = await global.handler(ctx, {
            banned: true,
            charger: true,
            cooldown: true,
            energy: 10
        });
        if (status) return ctx.reply(message);

        const input = ctx.args.join(" ") || null;

        if (!input) return ctx.reply(
            `${quote(global.tools.msg.generateInstruction(["send"], ["text"]))}\n` +
            global.tools.msg.generateCommandExample(ctx._used.prefix + ctx._used.command, "cat")
        );

        try {
            const apiUrl = global.tools.api.createUrl("https://google-image-api.vercel.app", "/search", {
                q: input
            });
            const {
                data
            } = await axios.get(apiUrl);
            const result = global.tools.general.getRandomElement(data.result);

            return await ctx.reply({
                image: {
                    url: result.url
                },
                mimetype: mime.contentType("png"),
                caption: `${quote(`Kueri: ${input}`)}\n` +
                    "\n" +
                    global.config.msg.footer
            });
        } catch (error) {
            console.error("[ckptw-wabot] Kesalahan:", error);
            if (error.status !== 200) return ctx.reply(global.config.msg.notFound);
            return ctx.reply(`${bold("[ ! ]")} Terjadi kesalahan: ${error.message}`);
        }
    }
};
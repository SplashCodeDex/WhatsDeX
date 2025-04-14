const {
    quote
} = require("@mengkodingan/ckptw");
const axios = require("axios");

module.exports = {
    name: "lyric",
    aliases: ["lirik"],
    category: "tool",
    permissions: {
        coin: 10
    },
    code: async (ctx) => {
        const input = ctx.args.join(" ") || null;

        if (!input) return await ctx.reply(
            `${quote(tools.cmd.generateInstruction(["send"], ["text"]))}\n` +
            quote(tools.cmd.generateCommandExample(ctx.used, "hikaru utada - one last kiss"))
        );

        try {
            const apiUrl = tools.api.createUrl("https://api.ureshii.my.id", "/api/search/lirikgoogle", {
                title: input
            });
            const result = (await axios.get(apiUrl)).data;

            return await ctx.reply(
                `${quote(`Judul: ${result.title}`)}\n` +
                `${quote(`Artis: ${result.artist}`)}\n` +
                `${quote("─────")}\n` +
                `${result.lyrics}\n` +
                "\n" +
                config.msg.footer
            );
        } catch (error) {
            return await tools.cmd.handleError(ctx, error, true);
        }
    }
};
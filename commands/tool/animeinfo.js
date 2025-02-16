const {
    quote
} = require("@mengkodingan/ckptw");
const axios = require("axios");

module.exports = {
    name: "animeinfo",
    aliases: ["anime"],
    category: "tool",
    permissions: {
        coin: 10
    },
    code: async (ctx) => {
        const input = ctx.args.join(" ") || null;

        if (!input) return await ctx.reply(
            `${quote(tools.msg.generateInstruction(["send"], ["text"]))}\n` +
            quote(tools.msg.generateCommandExample(ctx.used, "evangelion"))
        );

        try {
            const apiUrl = tools.api.createUrl("https://api.jikan.moe", "/v4/anime", {
                q: input
            });
            const result = (await axios.get(apiUrl)).data.data[0];

            return await ctx.reply(
                `${quote(`Judul: ${result.title}`)}\n` +
                `${quote(`Judul (Inggris): ${result.title_english}`)}\n` +
                `${quote(`Judul (Jepang): ${result.title_japanese}`)}\n` +
                `${quote(`Tipe: ${result.type}`)}\n` +
                `${quote(`Episode: ${result.episodes}`)}\n` +
                `${quote(`Durasi: ${result.duration}`)}\n` +
                `${quote(`URL: ${result.url}`)}\n` +
                `${quote("─────")}\n` +
                `${await tools.general.translate(result.synopsis, "id" )}\n` +
                "\n" +
                config.msg.footer
            );
        } catch (error) {
            consolefy.error(`Error: ${error}`);
            if (error.status !== 200) return await ctx.reply(config.msg.notFound);
            return await ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
        }
    }
};
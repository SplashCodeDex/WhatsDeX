const {
    monospace,
    quote
} = require("@itsreimau/ckptw-mod");
const axios = require("axios");

module.exports = {
    name: "alkitab",
    aliases: ["bible", "injil"],
    category: "tool",
    permissions: {
        coin: 10
    },
    code: async (ctx) => {
        const [passage, num] = ctx.args;

        if (!passage && !num) return await ctx.reply(
            `${quote(`${tools.cmd.generateInstruction(["send"], ["text"])}`)}\n` +
            `${quote(tools.cmd.generateCommandExample(ctx.used, "kej 2:18"))}\n` +
            quote(tools.cmd.generateNotes([`Ketik ${monospace(`${ctx.used.prefix + ctx.used.command} list`)} untuk melihat daftar.`]))
        );

        if (["l", "list"].includes(passage.toLowerCase())) {
            const listText = await tools.list.get("alkitab");
            return await ctx.reply(listText);
        }

        try {
            const apiUrl = tools.api.createUrl("https://api-alkitab.vercel.app", `/api/passage`, {
                passage,
                num
            });
            const result = (await axios.get(apiUrl)).data.bible.book;

            const resultText = result.chapter.verses.map(r =>
                `${quote(`Ayat: ${r.number}`)}\n` +
                `${quote(`${r.text}`)}`
            ).join(
                "\n" +
                `${quote("─────")}\n`
            );
            return await ctx.reply(
                `${quote(`Nama: ${result.name}`)}\n` +
                `${quote(`Bab: ${result.chapter.chap}`)}\n` +
                `${quote("─────")}\n` +
                `${resultText}\n` +
                "\n" +
                config.msg.footer
            );
        } catch (error) {
            return await tools.cmd.handleError(ctx, error, true);
        }
    }
};
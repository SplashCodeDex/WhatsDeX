const axios = require("axios");

module.exports = {
    name: "alquran",
    aliases: ["quran"],
    category: "tool",
    code: async (ctx) => {
        const { formatter, tools, config } = ctx.bot.context;
        const [surat, ayat] = ctx.args;

        if (!surat && !ayat) return await ctx.reply(
            `${formatter.quote(tools.msg.generateInstruction(["send"], ["text"]))}\n` +
            `${formatter.quote(tools.msg.generateCmdExample(ctx.used, "21 35"))}\n` +
            formatter.quote(tools.msg.generateNotes([`Type ${formatter.inlineCode(`${ctx.used.prefix + ctx.used.command} list`)} to see the list.`]))
        );

        if (surat.toLowerCase() === "list") {
            const listText = await tools.list.get("alquran");
            return await ctx.reply({
                text: listText,
                footer: config.msg.footer
            });
        }

        if (isNaN(surat) || surat < 1 || surat > 114) return await ctx.reply(formatter.quote("❎ Surah must be a number between 1 and 114!"));

        try {
            const apiUrl = tools.api.createUrl("neko", "/religious/nuquran-surah", {
                id: surat
            });
            const result = (await axios.get(apiUrl)).data.result;
            const verses = result.verses;

            if (ayat) {
                if (ayat.includes("-")) {
                    const [startAyat, endAyat] = ayat.split("-").map(Number);
                    const selectedVerses = verses.filter(vers => vers.number >= startAyat && vers.number <= endAyat);

                    if (isNaN(startAyat) || isNaN(endAyat) || startAyat < 1 || endAyat < startAyat) return await ctx.reply(formatter.quote("❎ Verse range is not valid!"));
                    if (!selectedVerses.length) return await ctx.reply(formatter.quote(`❎ Verses in range ${startAyat}-${endAyat} do not exist!`));

                    const versesText = selectedVerses.map(vers =>
                        `${formatter.quote(`Verse ${vers.number}:`)}\n` +
                        `${vers.text} (${vers.transliteration})\n` +
                        formatter.italic(vers.translation_id)
                    ).join("\n");
                    await ctx.reply({
                        text: `${formatter.quote(`Surah: ${result.name}`)}\n` +
                            `${formatter.quote(`Meaning: ${result.translate}`)}\n` +
                            `${formatter.quote("· · ─ ·✶· ─ · ·")}\n` +
                            versesText,
                        footer: config.msg.footer
                    });
                } else {
                    const singleAyat = parseInt(ayat);
                    const verse = verses.find(vers => vers.number === singleAyat);

                    if (isNaN(singleAyat) || singleAyat < 1) return await ctx.reply(formatter.quote("❎ Verse must be a valid number greater than 0!"));
                    if (!verse) return await ctx.reply(formatter.quote(`❎ Verse ${singleAyat} does not exist!`));

                    await ctx.reply({
                        text: `${formatter.quote(`Surah: ${result.name}`)}\n` +
                            `${formatter.quote(`Meaning: ${result.translate}`)}\n` +
                            `${formatter.quote("· · ─ ·✶· ─ · ·")}\n` +
                            `${verse.text} (${verse.transliteration})\n` +
                            formatter.italic(verse.translation_id),
                        footer: config.msg.footer
                    });
                }
            } else {
                const versesText = verses.map(vers =>
                    `${formatter.quote(`Verse ${vers.number}:`)}\n` +
                    `${vers.text} (${vers.transliteration})\n` +
                    formatter.italic(vers.translation_id)
                ).join("\n");
                await ctx.reply({
                    text: `${formatter.quote(`Surah: ${result.name}`)}\n` +
                        `${formatter.quote(`Meaning: ${result.translate}`)}\n` +
                        `${formatter.quote("· · ─ ·✶· ─ · ·")}\n` +
                        versesText,
                    footer: config.msg.footer
                });
            }
        } catch (error) {
            await tools.cmd.handleError(ctx, error, true);
        }
    }
};
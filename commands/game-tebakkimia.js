const {
    quote
} = require("@mengkodingan/ckptw");
const axios = require("axios");

const session = new Map();

module.exports = {
    name: "tebakkimia",
    category: "game",
    code: async (ctx) => {
        const {
            status,
            message
        } = await global.handler(ctx, {
            banned: true,
            cooldown: true
        });
        if (status) return ctx.reply(message);

        if (session.has(ctx.id)) return await ctx.reply(quote(`🎮 Sesi permainan sedang berjalan!`));

        try {
            const apiUrl = global.tools.api.createUrl("https://raw.githubusercontent.com", `/ramadhankukuh/database/master/src/games/tebakkimia.json`, {});
            const response = await axios.get(apiUrl);
            const data = global.tools.general.getRandomElement(response.data);
            const energy = 10;
            const timeout = 60000;
            const senderNumber = ctx.sender.jid.replace(/@.*|:.*/g, "");

            await session.set(ctx.id, true);

            await ctx.reply(
                `${quote(`Lambang: ${data.lambang}`)}` +
                (global.system.useenergy ?
                    "\n" +
                    `${quote(`+${energy} Energi`)}\n` :
                    "\n") +
                `${quote(`Batas waktu ${(timeout / 1000).toFixed(2)} detik.`)}\n` +
                `${quote('Ketik "hint" untuk bantuan.')}\n` +
                "\n" +
                global.msg.footer
            );

            const collector = ctx.MessageCollector({
                time: timeout
            });

            collector.on("collect", async (m) => {
                const userAnswer = m.content.toLowerCase();
                const answer = data.unsur.toLowerCase();

                if (userAnswer === answer) {
                    await session.delete(ctx.id);
                    if (global.system.useenergy) await global.db.add(`user.${senderNumber}.energy`, energy);
                    await ctx.sendMessage(
                        ctx.id, {
                            text: quote(`💯 Benar!`) +
                                (global.system.useenergy ?
                                    "\n" +
                                    quote(`+${energy} Energi`) :
                                    "")
                        }, {
                            quoted: m
                        }
                    );
                    return collector.stop();
                } else if (userAnswer === "hint") {
                    const clue = answer.replace(/[AIUEOaiueo]/g, "_");
                    await ctx.sendMessage(ctx.id, {
                        text: clue.toUpperCase()
                    }, {
                        quoted: m
                    });
                }
            });

            collector.on("end", async (collector, reason) => {
                const answer = data.unsur;

                if (await session.has(ctx.id)) {
                    await session.delete(ctx.id);

                    return ctx.reply(
                        `${quote(`⌛ Waktu habis!`)}\n` +
                        quote(`Jawabannya adalah ${answer}.`)
                    );
                }
            });

        } catch (error) {
            console.error("[ckptw-wabot] Kesalahan:", error);
            return ctx.reply(quote(`⚠ Terjadi kesalahan: ${error.message}`));
        }
    }
};
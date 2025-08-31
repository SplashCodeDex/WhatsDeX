const axios = require("axios");
const didYouMean = require("didyoumean");

const session = new Map();

module.exports = {
    name: "guessjkt48",
    aliases: ["guessjkt"],
    category: "game",
    code: async (ctx) => {
        if (session.has(ctx.id)) return await ctx.reply(formatter.quote("🎮 A game session is already in progress!"));

        try {
            const apiUrl = tools.api.createUrl("https://raw.githubusercontent.com", "/ERLANRAHMAT/games/refs/heads/main/tebakjkt48.json");
            const result = tools.cmd.getRandomElement((await axios.get(apiUrl)).data);

            const game = {
                coin: 10,
                timeout: 60000,
                answer: result.jawaban.toLowerCase()
            };

            session.set(ctx.id, true);

            await ctx.reply({
                image: {
                    url: result.img
                },
                mimetype: tools.mime.lookup("jpeg"),
                caption: `${formatter.quote(`Bonus: ${game.coin} Coins`)}
` +
                    formatter.quote(`Time limit: ${tools.msg.convertMsToDuration(game.timeout)}`),
                footer: config.msg.footer,
                buttons: [{
                    buttonId: "hint",
                    buttonText: {
                        displayText: "Hint"
                    }
                }, {
                    buttonId: "surrender",
                    buttonText: {
                        displayText: "Surrender"
                    }
                }]
            });

            const collector = ctx.MessageCollector({
                time: game.timeout
            });

            const playAgain = [{
                buttonId: ctx.used.prefix + ctx.used.command,
                buttonText: {
                    displayText: "Play Again"
                }
            }];

            collector.on("collect", async (m) => {
                const participantAnswer = m.content.toLowerCase();
                const participantId = ctx.getId(m.sender);

                if (participantAnswer === game.answer) {
                    session.delete(ctx.id);
                    collector.stop();
                    await db.add(`user.${participantId}.coin`, game.coin);
                    await db.add(`user.${participantId}.winGame`, 1);
                    await ctx.sendMessage(ctx.id, {
                        text: `${formatter.quote("💯 Correct!")}
` +
                            formatter.quote(`+${game.coin} Coins`),
                        footer: config.msg.footer,
                        buttons: playAgain
                    }, {
                        quoted: m
                    });
                } else if (participantAnswer === "hint") {
                    const clue = game.answer.replace(/[aiueo]/g, "_");
                    await ctx.sendMessage(ctx.id, {
                        text: formatter.monospace(clue.toUpperCase())
                    }, {
                        quoted: m
                    });
                } else if (participantAnswer === "surrender") {
                    session.delete(ctx.id);
                    collector.stop();
                    await ctx.sendMessage(ctx.id, {
                        text: `${formatter.quote("🏳️ You surrendered!")}
` +
                            formatter.quote(`The answer is ${tools.msg.ucwords(game.answer)}.`),
                        footer: config.msg.footer,
                        buttons: playAgain
                    }, {
                        quoted: m
                    });
                } else if (didYouMean(participantAnswer, [game.answer]) === game.answer) {
                    await ctx.sendMessage(ctx.id, {
                        text: formatter.quote("🎯 A little more!")
                    }, {
                        quoted: m
                    });
                }
            });

            collector.on("end", async () => {
                if (session.has(ctx.id)) {
                    session.delete(ctx.id);
                    await ctx.reply({
                        text: `${formatter.quote("⏱ Time is up!")}
` +
                            formatter.quote(`The answer is ${tools.msg.ucwords(game.answer)}.`),
                        footer: config.msg.footer,
                        buttons: playAgain
                    });
                }
            });
        } catch (error) {
            await tools.cmd.handleError(ctx, error, true);
        }
    }
};

const axios = require("axios");

module.exports = {
    name: "chatgpt",
    aliases: ["ai", "cgpt", "chatai", "gpt", "openai"],
    category: "ai-chat",
    permissions: {
        coin: 10
    },
    code: async (ctx) => {
        const { config, formatter, tools: { msg, cmd }, database } = ctx.bot.context;
        const input = ctx.args.join(" ") || ctx.quoted?.content || null;

        if (!config.api.openai) {
            return await ctx.reply(formatter.quote("⛔ OpenAI API key is not configured. Please configure it in the config file."));
        }

        if (!input) {
            return await ctx.reply(
                `${formatter.quote(msg.generateInstruction(["send"], ["text"]))}\n` +
                `${formatter.quote(cmd.generateCmdExample(ctx.used, "what is evangelion?"))}\n` +
                formatter.quote(msg.generateNotes(["Reply or quote a message to use its text as the target input, especially if the text requires a new line."]))
            );
        }

        try {
            const userId = ctx.author.id;
            const history = database.chat.getHistory(userId);

            const messages = [
                { role: "system", content: "You are a helpful assistant." },
                ...history,
                { role: "user", content: input }
            ];

            const response = await axios.post("https://api.openai.com/v1/chat/completions", {
                model: "gpt-3.5-turbo",
                messages: messages,
                temperature: 0.7
            }, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${config.api.openai}`
                }
            });

            const result = response.data.choices[0].message.content;

            database.chat.addHistory(userId, { role: "user", content: input });
            database.chat.addHistory(userId, { role: "assistant", content: result });

            await ctx.reply(result);
        } catch (error) {
            if (error.response && error.response.data && error.response.data.error) {
                console.error(error.response.data.error);
                await ctx.reply(formatter.quote(`⛔ OpenAI API Error: ${error.response.data.error.message}`));
            } else {
                await cmd.handleError(config, ctx, error, true);
            }
        }
    }
};
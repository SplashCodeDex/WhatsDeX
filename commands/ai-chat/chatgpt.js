const axios = require("axios");

module.exports = {
    name: "chatgpt",
    aliases: ["ai", "cgpt", "chatai", "gpt", "openai"],
    category: "ai-chat",
    permissions: {
        coin: 10
    },
    code: async (ctx) => {
        const { formatter, tools: { msg, api, cmd } } = ctx.self.context;
        const input = ctx.args.join(" ") || ctx.quoted?.content || null;

        if (!input) return await ctx.reply(
            `${formatter.quote(msg.generateInstruction(["send"], ["text"]))}\n` +
            `${formatter.quote(cmd.generateCmdExample(ctx.used, "what is evangelion?"))}\n` +
            formatter.quote(msg.generateNotes(["Reply or quote a message to use its text as the target input, especially if the text requires a new line."]))
        );

        try {
            const apiUrl = api.createUrl("davidcyril", "/ai/chatbot", {
                query: input
            });
            const result = (await axios.get(apiUrl)).data.result;

            await ctx.reply(result);
        } catch (error) {
            await cmd.handleError(ctx, error, true);
        }
    }
};
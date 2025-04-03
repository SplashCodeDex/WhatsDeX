const {
    quote
} = require("@mengkodingan/ckptw");
const axios = require("axios");
const mime = require("mime-types");

module.exports = {
    name: "copilot",
    category: "ai-chat",
    permissions: {
        coin: 10
    },
    code: async (ctx) => {
        const input = ctx.args.join(" ") || null;

        if (!input) return await ctx.reply(
            `${quote(tools.cmd.generateInstruction(["send"], ["text"]))}\n` +
            quote(tools.cmd.generateCommandExample(ctx.used, "apa itu bot whatsapp?"))
        );

        try {
            const senderUid = await db.get(`user.${tools.general.getID(ctx.sender.jid)}.uid`) || "guest";
            const apiUrl = tools.api.createUrl("fast", "/aillm/copilot", {
                ask: input,
                style: `You are a WhatsApp bot named ${config.bot.name}, owned by ${config.owner.name}. Be friendly, informative, and engaging. Never mention anyone other than ${ctx.sender.pushName}.`, // Dapat diubah sesuai keinginan Anda
                sessionId: senderUid
            });
            const result = (await axios.get(apiUrl)).data.result;
            const imageUrl = result.images[0]?.url;
            const resultText = result.text;

            if (imageUrl) {
                return await ctx.reply({
                    image: {
                        url: imageUrl
                    },
                    mimetype: mime.lookup("png"),
                    caption: resultText
                });
            } else {
                return await ctx.reply(resultText);
            }
        } catch (error) {
            return await tools.cmd.handleError(ctx, error, true);
        }
    }
};
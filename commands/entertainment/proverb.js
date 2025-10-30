const axios = require("axios");

module.exports = {
    name: "proverb",
    aliases: ["peribahasa"],
    category: "entertainment",
    permissions: {
        coin: 10
    },
    code: async (ctx) => {
        const { formatter, tools, config } = ctx.bot.context;
        try {
            const apiUrl = tools.api.createUrl("http://jagokata-api.hofeda4501.serv00.net", "/peribahasa-acak.php"); // Dihosting sendiri, karena jagokata-api.rf.gd malah error
            console.log('Calling proverb API:', apiUrl);
            const response = await axios.get(apiUrl);
            if (!response.data || !response.data.data || !Array.isArray(response.data.data) || response.data.data.length === 0) {
                throw new Error('Invalid or empty API response');
            }
            const result = tools.cmd.getRandomElement(response.data.data);
            if (!result || !result.kalimat || !result.arti) {
                throw new Error('Invalid proverb data structure');
            }

            await ctx.reply({
                text: `${formatter.quote(`Kalimat: ${result.kalimat}`)}\n` +
                    formatter.quote(`Arti: ${result.arti}`),
                footer: config.msg.footer,
                buttons: [{
                    buttonId: ctx.used.prefix + ctx.used.command,
                    buttonText: {
                        displayText: "Ambil Lagi"
                    }
                }]
            });
        } catch (error) {
            await tools.cmd.handleError(ctx.bot.context, ctx, error, true);
        }
    }
};
module.exports = {
    name: "elaina",
    category: "entertainment",
    permissions: {
        coin: 10
    },
    code: async (ctx) => {
        const { formatter, tools, config } = ctx.bot.context;
        try {
            const result = tools.api.createUrl("hang", "/random/elaina");

            await ctx.reply({
                image: {
                    url: result
                },
                mimetype: tools.mime.lookup("png"),
                caption: formatter.quote("Sou, Watashi desu!"),
                footer: config.msg.footer,
                buttons: [{
                    buttonId: ctx.used.prefix + ctx.used.command,
                    buttonText: {
                        displayText: "Ambil Lagi"
                    }
                }]
            });
        } catch (error) {
            await tools.cmd.handleError(ctx, error, true);
        }
    }
};
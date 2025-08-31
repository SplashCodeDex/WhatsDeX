module.exports = async (ctx) => {
    const { formatter, config } = ctx.self.context;
    const { isCmd } = ctx;

    if (isCmd?.didyoumean) {
        await ctx.reply({
            text: formatter.quote(`🧐 Apakah maksudmu ${formatter.inlineCode(isCmd.prefix + isCmd.didyoumean)}?`),
            footer: config.msg.footer,
            buttons: [{
                buttonId: `${isCmd.prefix + isCmd.didyoumean} ${isCmd.input}`,
                buttonText: {
                    displayText: "Ya, benar!"
                }
            }]
        });
    }

    return true;
};

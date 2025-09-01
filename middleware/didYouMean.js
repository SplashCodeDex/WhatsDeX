module.exports = async (ctx, context) => {
    const { formatter, config } = context;
    const { isCmd } = ctx;

    if (isCmd?.didyoumean) {
        await ctx.reply({
            text: formatter.quote(`🧐 Did you mean ${formatter.inlineCode(isCmd.prefix + isCmd.didyoumean)}?`),
            footer: config.msg.footer,
            buttons: [{
                buttonId: `${isCmd.prefix + isCmd.didyoumean} ${isCmd.input}`,
                buttonText: {
                    displayText: "Yes, that's right!"
                }
            }]
        });
    }

    return true;
};

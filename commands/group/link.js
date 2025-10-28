module.exports = {
    name: "link",
    aliases: ["gclink", "grouplink"],
    category: "group",
    permissions: {
        botAdmin: true,
        group: true
    },
    code: async (ctx) => {
        const { formatter, tools } = ctx.bot.context;
        try {
            const code = await ctx.group().inviteCode();

            await ctx.reply(formatter.quote(`https://chat.whatsapp.com/${code}`));
        } catch (error) {
            await tools.cmd.handleError(ctx, error);
        }
    }
};
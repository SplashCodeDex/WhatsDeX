module.exports = {
    name: "tagme",
    category: "group",
    permissions: {
        group: true
    },
    code: async (ctx) => {
        return await ctx.reply({
            text: `@${tools.cmd.getId(ctx.sender.jid)}`,
            mentions: [ctx.sender.jid]
        });
    }
};
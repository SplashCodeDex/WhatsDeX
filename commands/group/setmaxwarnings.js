const {
    monospace,
    quote
} = require("@itsreimau/ckptw-mod");

module.exports = {
    name: "setmaxwarnings",
    category: "group",
    permissions: {
        admin: true,
        botAdmin: true,
        group: true
    },
    code: async (ctx) => {
        const input = parseInt(ctx.args[0], 10);

        if (!input) return await ctx.reply(
            `${quote(`${tools.cmd.generateInstruction(["send"], ["text"])}`)}\n` +
            quote(tools.cmd.generateCommandExample(ctx.used, "8"))
        );

        try {
            const groupId = tools.general.getID(ctx.id);
            await db.set(`group.${groupId}.maxwarnings`, input);

            return await ctx.reply(quote(`✅ Berhasil mengubah max warnings!`));
        } catch (error) {
            return await tools.cmd.handleError(ctx, error, false);
        }
    }
};
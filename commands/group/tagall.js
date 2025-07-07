module.exports = {
    name: "tagall",
    category: "group",
    permissions: {
        admin: true,
        group: true
    },
    code: async (ctx) => {
        const input = ctx.args.join(" ") || ctx?.quoted?.conversation || (ctx.quoted && ((Object.values(ctx.quoted).find(v => v?.text || v?.caption)?.text) || (Object.values(ctx.quoted).find(v => v?.text || v?.caption)?.caption))) || formatter.quote("👋 Halo, Dunia!");

        try {
            const members = await ctx.group().members();
            const mentions = members.map(m => {
                const serialized = ctx.getId(m.id);
                return {
                    tag: `@${serialized}`,
                    mention: m.id
                };
            });

            const resultText = mentions.map(m => m.tag).join(" ");
            return await ctx.reply({
                text: `${input}\n` +
                    `─────${config.msg.readmore}\n` +
                    resultText,
                mentions: mentions.map(m => m.mention)
            });
        } catch (error) {
            return await tools.cmd.handleError(ctx, error);
        }
    }
};
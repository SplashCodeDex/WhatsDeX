const {
    quote
} = require("@itsreimau/ckptw-mod");

module.exports = {
    name: "listpendingmembers",
    aliases: ["pendingmembers"],
    category: "group",
    permissions: {
        admin: true,
        botAdmin: true,
        group: true
    },
    code: async (ctx) => {
        const pending = await ctx.group().pendingMembers();

        if (!pending || pending.length === 0) return await ctx.reply(quote("✅ Tidak ada anggota yang menunggu persetujuan."));

        try {
            const resultText = pending.map((member, index) => {
                const id = tools.general.getID(member.jid);
                return quote(`${index + 1}. ${id}`);
            }).join("\n");

            return await ctx.reply(
                `${resultText}\n` +
                "\n" +
                config.msg.footer
            );
        } catch (error) {
            return await tools.cmd.handleError(ctx, error, false);
        }
    }
};
const {
    quote
} = require("@itsreimau/ckptw-mod");

module.exports = {
    name: "approve",
    category: "group",
    permissions: {
        admin: true,
        botAdmin: true,
        group: true
    },
    code: async (ctx) => {
        const input = ctx.args.join(" ") || null;

        if (!input) return await ctx.reply(
            `${quote(tools.cmd.generateInstruction(["send"], ["text"]))}\n` +
            `${quote(tools.cmd.generateCommandExample(ctx.used, tools.general.getID(ctx.sender.jid)))}\n` +
            quote(tools.cmd.generateNotes([`Ketik ${monospace(`${ctx.used.prefix + ctx.used.command} all`)} untuk menyetujui semua anggota yang tertunda.`]))
        );

        const pending = await ctx.group().pendingMembers();

        if (["a", "all"].includes(input.toLowerCase())) {
            if (pending.length === 0) return await ctx.reply(quote("✅ Tidak ada anggota yang menunggu persetujuan."));

            try {
                const allJids = pending.map(p => p.jid);
                await ctx.group().approvePendingMembers(allJids);

                return await ctx.reply(quote(`✅ Berhasil menyetujui semua anggota (${allJids.length}).`));
            } catch (error) {
                return await tools.cmd.handleError(ctx, error, false);
            }
        }

        const accountJid = `${input.replace(/[^\d]/g, "")}@s.whatsapp.net`;

        const isPending = pending.some(p => p.jid === accountJid);
        if (!isPending) return await ctx.reply(quote("❎ Akun tidak ditemukan di daftar anggota yang menunggu persetujuan."));

        try {
            await ctx.group().approvePendingMembers([accountJid]);

            return await ctx.reply(quote("✅ Berhasil disetujui!"));
        } catch (error) {
            return await tools.cmd.handleError(ctx, error, false);
        }
    }
};
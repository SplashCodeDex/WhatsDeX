const {
    monospace,
    quote
} = require("@itsreimau/gktw");

module.exports = {
    name: "omute",
    category: "owner",
    permissions: {
        group: true,
        owner: true
    },
    code: async (ctx) => {
        const groupId = ctx.getId(ctx.id);

        if (["b", "bot"].includes(ctx.args[0]?.toLowerCase())) {
            await db.set(`group.${groupId}.mutebot`, "owner");
            return await ctx.reply(quote("✅ Berhasil me-mute grup ini dari bot!"));
        }

        const accountJid = ctx.quoted.senderJid || ctx.msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || null;
        const accountId = ctx.getId(accountJid);

        if (!accountJid) return await ctx.reply({
            text: `${quote(tools.msg.generateInstruction(["send"], ["text"]))}\n` +
                `${quote(tools.msg.generateCmdExample(ctx.used, `@${ctx.getId(ctx.sender.jid)}`))}\n` +
                quote(tools.msg.generateNotes(["Balas atau kutip pesan untuk menjadikan pengirim sebagai akun target.", `Ketik ${monospace(`${ctx.used.prefix + ctx.used.command} bot`)} untuk me-mute bot.`])),
            mentions: [ctx.sender.jid]
        });

        if (accountId === config.bot.id) return await ctx.reply(quote(`❎ Ketik ${monospace(`${ctx.used.prefix + ctx.used.command} bot`)} untuk me-mute bot.`));
        if (accountJid === await ctx.group().owner()) return await ctx.reply(quote("❎ Dia adalah owner grup!"));

        try {
            const muteList = await db.get(`group.${groupId}.mute`) || [];
            if (!muteList.includes(accountId)) muteList.push(accountId);
            await db.set(`group.${groupId}.mute`, muteList);

            return await ctx.reply(quote("✅ Berhasil me-mute pengguna itu dari grup ini!"));
        } catch (error) {
            return await tools.cmd.handleError(ctx, error);
        }
    }
};
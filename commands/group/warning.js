const {
    monospace,
    quote
} = require("@itsreimau/ckptw-mod");

module.exports = {
    name: "warning",
    category: "group",
    permissions: {
        admin: true,
        botAdmin: true,
        group: true,
        restrict: true
    },
    code: async (ctx) => {
        const accountJid = ctx.quoted.senderJid || ctx.msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || null;
        const accountId = tools.general.getID(accountJid);

        const senderJid = ctx.sender.jid;
        const senderId = tools.general.getID(senderJid);

        if (!accountJid) return await ctx.reply({
            text: `${quote(tools.cmd.generateInstruction(["send"], ["text"]))}\n` +
                `${quote(tools.cmd.generateCommandExample(ctx.used, `@${senderId}`))}\n` +
                quote(tools.cmd.generateNotes(["Balas atau kutip pesan untuk memberikan warning ke pengguna."])),
            mentions: [senderJid]
        });

        if (accountId === config.bot.id) return await ctx.reply(quote(`❎ Tidak bisa memberikan warning ke bot.`));

        if (await ctx.group().isAdmin(accountJid)) return await ctx.reply(quote("❎ Tidak bisa memberikan warning ke admin grup!"));

        try {
            const groupId = tools.general.getID(ctx.id);
            const groupDb = await db.get(`group.${groupId}`) || {};
            const warnings = groupDb?.warnings || {};
            const current = warnings[accountId] || 0;
            const newWarning = current + 1;

            const maxwarnings = groupDb?.maxwarnings || 3;
            if (newWarning >= maxwarnings) {
                await ctx.reply(quote("⛔ Anda telah menerima 5 warning dan akan dikeluarkan dari grup!"));
                if (!config.system.restrict) await ctx.group().kick([senderJid]);
                delete warnings[senderId];
                return await db.set(`group.${groupId}.warnings`, warnings);
            }

            warnings[accountId] = newWarning;

            await db.set(`group.${groupId}.warnings`, warnings);

            return await ctx.reply(quote(`✅ Warning diberikan! Sekarang warning @${accountId} menjadi ${newWarning}/5.`), {
                mentions: [accountJid]
            });
        } catch (error) {
            return await tools.cmd.handleError(ctx, error, false);
        }
    }
};
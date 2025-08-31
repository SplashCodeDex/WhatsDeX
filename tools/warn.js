async function addWarning(ctx, groupDb, senderJid, groupId) {
    const { database, formatter, config } = ctx.self.context;
    const senderId = ctx.getId(senderJid);
    const maxWarnings = groupDb?.maxwarnings || 3;

    const warnings = groupDb?.warnings || [];

    const userWarning = warnings.find(warning => warning.userId === senderId);
    let currentWarnings = userWarning ? userWarning.count : 0;
    currentWarnings += 1;

    if (userWarning) {
        userWarning.count = currentWarnings;
    } else {
        warnings.push({
            userId: senderId,
            count: currentWarnings
        });
    }

    await database.group.update(groupId, { warnings });
    await ctx.reply({
        text: formatter.quote(`⚠️ Warning ${currentWarnings}/${maxWarnings} untuk @${senderId}!`),
        mentions: [senderJid]
    });

    if (currentWarnings >= maxWarnings) {
        await ctx.reply(formatter.quote(`⛔ Kamu telah menerima ${maxWarnings} warning dan akan dikeluarkan dari grup!`));
        if (!config.system.restrict) await ctx.group().kick(senderJid);
        await database.group.update(groupId, { warnings: warnings.filter(warning => warning.userId !== senderId) });
    }
}

module.exports = {
    addWarning
};

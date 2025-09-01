module.exports = async (ctx) => {
    const { database } = ctx.self.context;
    const { isGroup, isOwner, userDb } = ctx;

    const botDb = await database.bot.get();

    if (botDb?.mode === "group" && !isGroup() && !isOwner && !userDb?.premium) return false;
    if (botDb?.mode === "private" && isGroup() && !isOwner && !userDb?.premium) return false;
    if (botDb?.mode === "self" && !isOwner) return false;

    return true;
};

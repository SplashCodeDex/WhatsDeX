module.exports = (db) => ({
    async get(property) {
        if (property) {
            return await db.get(`bot.${property}`);
        }
        return await db.get("bot") || {};
    },

    async set(data) {
        return await db.set("bot", data);
    },

    async update(data) {
        const botData = await this.get();
        const updatedData = { ...botData, ...data };
        return await this.set(updatedData);
    }
});

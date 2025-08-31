module.exports = (db) => ({
    async get(userId) {
        return await db.get(`user.${userId}`) || {};
    },

    async set(userId, data) {
        return await db.set(`user.${userId}`, data);
    },

    async update(userId, data) {
        const userData = await this.get(userId);
        const updatedData = { ...userData, ...data };
        return await this.set(userId, updatedData);
    },

    async delete(userId) {
        return await db.delete(`user.${userId}`);
    }
});

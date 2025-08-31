module.exports = (db) => ({
    async getAll() {
        return await db.get("menfess") || {};
    },

    async delete(menfessId) {
        return await db.delete(`menfess.${menfessId}`);
    }
});

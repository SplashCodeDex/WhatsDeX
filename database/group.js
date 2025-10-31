module.exports = db => ({
  async get(groupId) {
    return (await db.get(`group.${groupId}`)) || {};
  },

  async set(groupId, data) {
    return await db.set(`group.${groupId}`, data);
  },

  async update(groupId, data) {
    const groupData = await this.get(groupId);
    const updatedData = { ...groupData, ...data };
    return await this.set(groupId, updatedData);
  },

  async delete(groupId) {
    return await db.delete(`group.${groupId}`);
  },
});

module.exports = async (job) => {
    const { msg } = job.data;
    // Note: bot needs to be accessed globally or passed differently; for now, assume global.bot or implement bot access
    const bot = global.bot; // Assume bot is set globally in main.js

    const key = {
        remoteJid: msg.key.remoteJid,
        fromMe: msg.key.fromMe,
        id: msg.key.id
    }

    const messageType = msg.type || Object.keys(msg.message || {})[0];
    if (messageType === 'conversation') {
        const text = msg.message.conversation;
        if (text === '!ping') {
            await bot.sendMessage(key.remoteJid, {
                text: 'Pong!'
            }); // Removed quoted as msg is now serializable, not full object
        }
    }
};
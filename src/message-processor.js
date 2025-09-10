module.exports = async (job) => {
    const { bot, msg } = job.data;

    const key = {
        remoteJid: msg.key.remoteJid,
        fromMe: msg.key.fromMe,
        id: msg.key.id
    }

    const messageType = Object.keys(msg.message)[0];
    if (messageType === 'conversation') {
        const text = msg.message.conversation;
        if (text === '!ping') {
            await bot.sendMessage(key.remoteJid, {
                text: 'Pong!'
            }, {
                quoted: msg
            });
        }
    }
};
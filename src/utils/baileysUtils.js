const getJid = (input) => {
    if (input.endsWith('@s.whatsapp.net') || input.endsWith('@g.us')) {
        return input;
    }
    return input + '@s.whatsapp.net'; // Default to user JID
};

const getSender = (msg) => {
    return msg.key.fromMe ? getJid(msg.key.remoteJid) : getJid(msg.key.participant || msg.key.remoteJid);
};

const getGroup = (msg) => {
    return msg.key.remoteJid.endsWith('@g.us') ? msg.key.remoteJid : null;
};

module.exports = {
    getJid,
    getSender,
    getGroup,
};
import { jidDecode, getContentType, downloadContentFromMessage } from '@whiskeysockets/baileys';


export const decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
        const decode = jidDecode(jid) || {};
        return (decode.user && decode.server && decode.user + '@' + decode.server) || jid;
    }
    return jid;
};

export const serialize = (bot, m) => {
    if (!m) return m;
    const M = {};
    if (m.key) {
        M.key = m.key;
        M.id = m.key.id;
        M.isBaileys = M.id.startsWith('BAE5') && M.id.length === 16;
        M.chat = M.key.remoteJid;
        M.fromMe = M.key.fromMe;
        M.isGroup = M.chat.endsWith('@g.us');
        M.sender = M.fromMe ? (bot.user?.id || bot.user?.jid) : (M.isGroup ? m.key.participant : M.chat);
        if (M.sender) M.sender = decodeJid(M.sender);
    }
    if (m.message) {
        M.message = m.message;
        M.type = getContentType(m.message);
        M.msg = (M.type === 'viewOnceMessage' || M.type === 'viewOnceMessageV2') ? M.message[M.type].message[getContentType(M.message[M.type].message)] : M.message[M.type];

        // Extract text content
        if (M.type === 'conversation') {
            M.content = M.message.conversation;
        } else if (M.type === 'extendedTextMessage') {
            M.content = M.message.extendedTextMessage?.text;
        } else if (M.type === 'imageMessage') {
            M.content = M.message.imageMessage?.caption;
        } else if (M.type === 'videoMessage') {
            M.content = M.message.videoMessage?.caption;
        } else if (M.type === 'viewOnceMessageV2') {
            const msg = M.message.viewOnceMessageV2?.message;
            const type = getContentType(msg);
            M.content = msg?.[type]?.caption || '';
        }

        M.content = M.content || '';

        M.text = M.content; // Alias

        // Quoted message handling could be added here if needed
    }

    M.pushName = m.pushName;

    return M;
};

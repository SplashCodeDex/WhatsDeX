import { jidDecode, downloadContentFromMessage, getContentType } from '@whiskeysockets/baileys';
import fileType from 'file-type';
const { fileTypeFromBuffer } = fileType;

export const decodeJid = jid => {
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
    M.chat = m.key.remoteJid;
    M.fromMe = m.key.fromMe;
    M.isGroup = M.chat.endsWith('@g.us');
    M.sender = M.fromMe ? bot.user.id : M.isGroup ? m.key.participant : M.chat;
    if (M.sender) M.sender = decodeJid(M.sender);
  }

  if (m.message) {
    M.message = m.message;
    M.type = getContentType(m.message) || Object.keys(m.message)[0];
    M.msg = m.message[M.type];

    // Alias for compatibility
    M.contentType = M.type;

    // Handle ephemeral/view once messages
    if (['viewOnceMessage', 'viewOnceMessageV2'].includes(M.type)) {
      M.msg = m.message[M.type].message[getContentType(m.message[M.type].message)];
      M.type = getContentType(m.message[M.type].message);
      M.contentType = M.type;
    }

    // Text extraction
    M.text =
      M.msg?.text ||
      M.msg?.caption ||
      M.msg?.conversation ||
      M.msg?.contentText ||
      M.msg?.selectedDisplayText ||
      M.msg?.title ||
      '';

    // Quoted message handling
    M.quoted = M.msg?.contextInfo?.quotedMessage ? {} : null;
    if (M.quoted) {
      const type = getContentType(M.msg.contextInfo.quotedMessage);
      M.quoted.message = M.msg.contextInfo.quotedMessage;
      M.quoted.key = {
        remoteJid: M.msg.contextInfo.remoteJid || M.chat,
        fromMe: M.msg.contextInfo.participant === bot.user.id,
        id: M.msg.contextInfo.stanzaId,
        participant: decodeJid(M.msg.contextInfo.participant),
      };
      M.quoted.type = type;
      M.quoted.id = M.msg.contextInfo.stanzaId;
      M.quoted.chat = M.quoted.key.remoteJid;
      M.quoted.sender = M.quoted.key.participant;
      M.quoted.fromMe = M.quoted.key.fromMe;
      M.quoted.text =
        M.quoted.message[type]?.text ||
        M.quoted.message[type]?.caption ||
        M.quoted.message[type]?.conversation ||
        M.quoted.message[type]?.contentText ||
        M.quoted.message[type]?.selectedDisplayText ||
        M.quoted.message[type]?.title ||
        '';
      M.quoted.isBaileys = M.quoted.id
        ? M.quoted.id.startsWith('BAE5') && M.quoted.id.length === 16
        : false;

      // Helper: Download Quoted Media
      M.quoted.download = async () => {
        const stream = await downloadContentFromMessage(
          M.quoted.message[M.quoted.type],
          M.quoted.type.replace('Message', '')
        );
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
          buffer = Buffer.concat([buffer, chunk]);
        }
        return buffer;
      };
    }
  }

  // Helper: Reply
  M.reply = async (text, options = {}) => {
    return await bot.sendMessage(M.chat, { text, ...options }, { quoted: m });
  };

  // Helper: React
  M.react = async emoji => {
    return await bot.sendMessage(M.chat, {
      react: {
        text: emoji,
        key: M.key,
      },
    });
  };

  // Helper: Download Media
  M.download = async () => {
    if (!M.msg) throw new Error('No message content to download');
    const stream = await downloadContentFromMessage(M.msg, M.type.replace('Message', ''));
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }
    return buffer;
  };

  // Helper: Copy & Forward
  M.copyNForward = async (jid, forceForward = false, options = {}) => {
    let vtype;
    if (options.readViewOnce) {
      M.message[M.type].viewOnce = false;
      M.message[M.type].message[getContentType(M.message[M.type].message)].viewOnce = false;
      vtype = Object.keys(M.message[M.type].message)[0];
      delete M.message[M.type].message[vtype].viewOnce;
      M.message[M.type].message[vtype].viewOnce = false;
    }
    const mtype = getContentType(M.message);
    let content = M.message[mtype];
    const forwardContent = {
      [mtype]: content,
      ...options,
    };
    // Ensure we are forwarding the actual content
    if (M.quoted && !forceForward) {
      // Logic to forward quoted if needed, but usually copyNForward forwards the current message
    }

    // Basic forward implementation using Baileys built-in if available, or manual copy
    // For now, we use a simple sendMessage with forward
    // Note: Baileys v6+ has simplified forwarding.
    // We'll use the copy logic.

    return await bot.sendMessage(jid, { forward: m, force: forceForward, ...options });
  };

  return M;
};

export default { serialize, decodeJid };

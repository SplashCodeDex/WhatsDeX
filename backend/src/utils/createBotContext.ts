import moment from 'moment-timezone';
import { getJid, getSender, getGroup } from './baileysUtils.js';
// import { Cooldown } from '../middleware/cooldown.js'; // Removed
import { db } from '../lib/firebase.js';

const createBotContext = async (
  botInstance: any,
  rawBaileysMessage: any,
  originalContext: any,
  requestInfo: any = {}
) => {
  const { tools, config, formatter } = originalContext;

  const senderJid = getSender(rawBaileysMessage);
  const senderId = getSender(rawBaileysMessage);
  const isGroup = rawBaileysMessage.key.remoteJid.endsWith('@g.us');
  const groupJid = getGroup(rawBaileysMessage);
  const groupId = getGroup(rawBaileysMessage);

  // Instantiate Cooldown
  // const cooldown = new Cooldown(); // Removed
  const cooldown = null;

  const useDirectBaileys = process.env.USE_BAILEYS_DIRECT === 'true' || process.env.NODE_ENV === 'production';

  // Reply via Baileys in production; fallback to HTTP simulation
  const reply = async (content: any) => {
    const messageContent = typeof content === 'string' ? { text: content } : content;
    if (useDirectBaileys && botInstance?.sendMessage) {
      return await botInstance.sendMessage(rawBaileysMessage.key.remoteJid, messageContent, { quoted: rawBaileysMessage });
    }
    // Fallback or dev mode
    try {
      await fetch(`${process.env.BOT_SERVICE_URL}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: rawBaileysMessage.key.remoteJid, message: messageContent }),
      });
    } catch (e) { }
  };

  const replyReact = async (emoji: string) => {
    if (useDirectBaileys && botInstance?.sendMessage) {
      return await botInstance.sendMessage(rawBaileysMessage.key.remoteJid, { react: { text: emoji, key: rawBaileysMessage.key } });
    }
    try {
      await fetch(`${process.env.BOT_SERVICE_URL}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: rawBaileysMessage.key.remoteJid, message: { react: { text: emoji, key: rawBaileysMessage.key } } }),
      });
    } catch (e) { }
  };

  const simulateTyping = async () => {
    if (useDirectBaileys && botInstance?.presenceSubscribe && botInstance?.sendPresenceUpdate) {
      try {
        await botInstance.presenceSubscribe(rawBaileysMessage.key.remoteJid);
        await botInstance.sendPresenceUpdate('composing', rawBaileysMessage.key.remoteJid);
        setTimeout(() => botInstance.sendPresenceUpdate('paused', rawBaileysMessage.key.remoteJid).catch(() => { }), 1500);
        return;
      } catch (_) { /* fall back to HTTP */ }
    }
    try {
      await fetch(`${process.env.BOT_SERVICE_URL}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: rawBaileysMessage.key.remoteJid, message: { typing: true } }),
      });
    } catch (e) { }
  };

  // Implement ctx.group() methods
  const group = (jid = groupId) => ({
    isAdmin: async (userJid: string) => {
      if (!jid) return false;
      try {
        const memberSnapshot = await db.collection('groups').doc(jid).collection('members').doc(userJid).get();
        if (memberSnapshot.exists) {
          const role = memberSnapshot.data()?.role;
          return role === 'admin' || role === 'superadmin';
        }
      } catch (e) { }
      return false;
    },
    isBotAdmin: async () => {
      if (!jid) return false;
      const botJid = config.bot?.jid;
      if (!botJid) return false;
      try {
        const memberSnapshot = await db.collection('groups').doc(jid).collection('members').doc(botJid).get();
        if (memberSnapshot.exists) {
          const role = memberSnapshot.data()?.role;
          return role === 'admin' || role === 'superadmin';
        }
      } catch (e) { }
      return false;
    },
    members: async () => {
      if (!jid) return [];
      try {
        const membersSnapshot = await db.collection('groups').doc(jid).collection('members').get();
        return membersSnapshot.docs.map(doc => ({
          jid: doc.id,
          id: doc.id,
          role: doc.data().role
        }));
      } catch (e) { return []; }
    },
    metadata: async () => {
      if (!jid || !botInstance?.groupMetadata) return null;
      return await botInstance.groupMetadata(jid);
    },
    owner: async () => {
      if (!jid || !botInstance?.groupMetadata) return null;
      const meta = await botInstance.groupMetadata(jid);
      return meta.owner || null;
    },
    name: async () => {
      if (!jid || !botInstance?.groupMetadata) return '';
      const meta = await botInstance.groupMetadata(jid);
      return meta.subject || '';
    },
    add: async (jids: string[]) => {
      if (!jid || !botInstance?.groupParticipantsUpdate) return null;
      return await botInstance.groupParticipantsUpdate(jid, jids, 'add');
    },
    kick: async (jids: string[]) => {
      if (!jid || !botInstance?.groupParticipantsUpdate) return null;
      return await botInstance.groupParticipantsUpdate(jid, jids, 'remove');
    },
    promote: async (jids: string[]) => {
      if (!jid || !botInstance?.groupParticipantsUpdate) return null;
      return await botInstance.groupParticipantsUpdate(jid, jids, 'promote');
    },
    demote: async (jids: string[]) => {
      if (!jid || !botInstance?.groupParticipantsUpdate) return null;
      return await botInstance.groupParticipantsUpdate(jid, jids, 'demote');
    },
    inviteCode: async () => {
      if (!jid || !botInstance?.groupInviteCode) return '';
      return await botInstance.groupInviteCode(jid);
    },
    pendingMembers: async () => {
      return []; // Not implemented in Baileys easily without extra logic
    },
    approvePendingMembers: async (jids: string[]) => {
      return null;
    },
    rejectPendingMembers: async (jids: string[]) => {
      return null;
    },
    updateDescription: async (desc: string) => {
      if (!jid || !botInstance?.groupUpdateDescription) return null;
      return await botInstance.groupUpdateDescription(jid, desc);
    },
    updateSubject: async (subject: string) => {
      if (!jid || !botInstance?.groupUpdateSubject) return null;
      return await botInstance.groupUpdateSubject(jid, subject);
    },
    joinApproval: async (mode: 'on' | 'off') => {
      if (!jid || !botInstance?.groupJoinApprovalMode) return null;
      return await botInstance.groupJoinApprovalMode(jid, mode);
    },
    membersCanAddMemberMode: async (mode: 'on' | 'off') => {
      if (!jid || !botInstance?.groupMemberAddMode) return null;
      return await botInstance.groupMemberAddMode(mode === 'on');
    },
    isOwner: async (userJid: string) => {
      if (!jid || !botInstance?.groupMetadata) return false;
      const meta = await botInstance.groupMetadata(jid);
      return meta.owner === userJid;
    },
    matchAdmin: async (userJid: string) => {
      // Logic same as isAdmin for now
      if (!jid) return false;
      try {
        const memberSnapshot = await db.collection('groups').doc(jid).collection('members').doc(userJid).get();
        if (memberSnapshot.exists) {
          const role = memberSnapshot.data()?.role;
          return role === 'admin' || role === 'superadmin';
        }
      } catch (e) { }
      return false;
    }
  });

  // Simulate ctx.used (command parsing)
  const used = {
    command:
      rawBaileysMessage.message?.conversation
        ?.split(' ')[0]
        ?.toLowerCase()
        .substring(config.bot.prefix.length) || '',
    prefix: config.bot.prefix,
    args: rawBaileysMessage.message?.conversation?.split(' ').slice(1) || [],
    text: rawBaileysMessage.message?.conversation || '',
  };

  const getCommand = (commandName: string) =>
    originalContext.bot.cmd.get(commandName);

  const ctx: any = {
    bot: {
      ...botInstance,
      cmd: {
        get: getCommand,
        values: () => originalContext.bot.cmd.values(),
      },
      context: originalContext,
    },
    msg: rawBaileysMessage,
    isGroup: () => isGroup,
    isPrivate: () => !isGroup,
    groupId,
    sender: { jid: senderJid, id: senderId },
    getId: (jid: string) => getJid(jid),
    group,
    reply,
    replyReact,
    simulateTyping,
    used,
    // cooldown: null, // Removed broken Cooldown class usage
    ip: requestInfo.ip || 'unknown',
    userAgent: requestInfo.userAgent || 'WhatsApp',
    sessionId: requestInfo.sessionId || 'unknown',
    location: requestInfo.location || 'unknown',
    sendMessage: async (jid: string, content: any, options: any = {}) => {
      if (botInstance?.sendMessage) {
        return await botInstance.sendMessage(jid, content, options);
      }
    },
    download: async () => {
      // Placeholder for download method
      return Buffer.from([]);
    }
  };

  const isOwner = tools.cmd.isOwner(config, senderId, rawBaileysMessage.key.id);
  const isAdmin = isGroup ? await ctx.group().isAdmin(senderId) : false;

  ctx.isOwner = isOwner;
  ctx.isAdmin = isAdmin;

  return ctx;
};

export { createBotContext };
export default createBotContext;

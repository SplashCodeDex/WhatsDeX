import moment from 'moment-timezone';
import { getJid, getSender, getGroup } from './baileysUtils.js';
import { db } from '../lib/firebase.js';
import { downloadContentFromMessage, getContentType } from 'baileys';

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
      if (!jid || !botInstance.tenantId) return false;
      try {
        const memberSnapshot = await db.collection('tenants').doc(botInstance.tenantId).collection('groups').doc(jid).collection('members').doc(userJid).get();
        if (memberSnapshot.exists) {
          const role = memberSnapshot.data()?.role;
          return role === 'admin' || role === 'superadmin';
        }
      } catch (e) { }
      return false;
    },
    isBotAdmin: async () => {
      if (!jid || !botInstance.tenantId) return false;
      const botJid = config.bot?.jid;
      if (!botJid) return false;
      try {
        const memberSnapshot = await db.collection('tenants').doc(botInstance.tenantId).collection('groups').doc(jid).collection('members').doc(botJid).get();
        if (memberSnapshot.exists) {
          const role = memberSnapshot.data()?.role;
          return role === 'admin' || role === 'superadmin';
        }
      } catch (e) { }
      return false;
    },
    members: async () => {
      if (!jid || !botInstance.tenantId) return [];
      try {
        const membersSnapshot = await db.collection('tenants').doc(botInstance.tenantId).collection('groups').doc(jid).collection('members').get();
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
      if (!jid || !botInstance.tenantId) return false;
      try {
        const memberSnapshot = await db.collection('tenants').doc(botInstance.tenantId).collection('groups').doc(jid).collection('members').doc(userJid).get();
        if (memberSnapshot.exists) {
          const role = memberSnapshot.data()?.role;
          return role === 'admin' || role === 'superadmin';
        }
      } catch (e) { }
      return false;
    }
  });

  // Determine the prefix to use: Priority given to BotConfig
  const prefixes = botInstance.config?.prefix || [config.bot.prefix];
  const messageBody = rawBaileysMessage.message?.conversation ||
    rawBaileysMessage.message?.extendedTextMessage?.text || '';

  let detectedPrefix = '';
  for (const p of prefixes) {
    if (messageBody.startsWith(p)) {
      detectedPrefix = p;
      break;
    }
  }

  // Handle Auto Read if configured
  if (botInstance.config?.autoRead && rawBaileysMessage.key.remoteJid) {
    botInstance.readMessages([rawBaileysMessage.key]).catch(() => { });
  }

  // Simulate ctx.used (command parsing)
  const used = {
    command: detectedPrefix ?
      messageBody.split(' ')[0].toLowerCase().substring(detectedPrefix.length) :
      '',
    prefix: detectedPrefix || prefixes[0],
    args: messageBody.split(' ').slice(1) || [],
    text: messageBody,
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
      // 2026: Functional Media Download
      const quotedMsg = rawBaileysMessage.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const messageToDownload = quotedMsg ?
        { [Object.keys(quotedMsg)[0]]: quotedMsg[Object.keys(quotedMsg)[0]] } :
        rawBaileysMessage.message;

      if (!messageToDownload) throw new Error('No media found to download');

      const type = getContentType(messageToDownload);
      if (!type) throw new Error('Could not determine media type');

      const stream = await downloadContentFromMessage(
        (messageToDownload as any)[type],
        type.replace('Message', '') as any
      );

      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }
      return buffer;
    }
  };

  // Fetch tenant settings for owner check
  let ownerNumber = 'system';
  try {
    const tenantResult = await originalContext.tenantConfigService.getTenantSettings(botInstance?.tenantId || 'system');
    if (tenantResult.success && tenantResult.data.ownerNumber) {
      ownerNumber = tenantResult.data.ownerNumber;
    }
  } catch (err) {
    originalContext.logger.warn('Failed to fetch tenant settings for owner check', err);
  }

  const isOwner = tools.cmd.isOwner([ownerNumber], senderId, rawBaileysMessage.key.id);
  const isAdmin = isGroup ? await ctx.group().isAdmin(senderId) : false;

  ctx.isOwner = isOwner;
  ctx.isAdmin = isAdmin;

  return ctx;
};

export { createBotContext };
export default createBotContext;

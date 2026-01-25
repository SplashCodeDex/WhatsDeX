import { db } from '../lib/firebase.js';
import { downloadContentFromMessage, getContentType, type proto } from 'baileys';
import { getJid, getSender, getGroup } from './baileysUtils.js';
import type { Bot, GlobalContext, MessageContext } from '../types/index.js';
import type { TenantSettings } from '../types/tenantConfig.js';

const createBotContext = async (
  botInstance: Bot,
  rawBaileysMessage: proto.IWebMessageInfo,
  originalContext: GlobalContext,
  requestInfo: any = {}
): Promise<MessageContext> => {
  const { tools, config } = originalContext;

  const senderJid = getSender(rawBaileysMessage);
  const senderId = getSender(rawBaileysMessage);
  const remoteJid = rawBaileysMessage.key.remoteJid || '';
  const isGroup = remoteJid.endsWith('@g.us');
  const groupJid = getGroup(rawBaileysMessage);
  const groupId = getGroup(rawBaileysMessage);

  const useDirectBaileys = process.env.USE_BAILEYS_DIRECT === 'true' || process.env.NODE_ENV === 'production';

  // Fetch tenant settings strictly
  const tenantResult = await originalContext.tenantConfigService.getTenantSettings(botInstance.tenantId);
  if (!tenantResult.success) {
    // In strict mode, we might want to throw, but for resilience, we'll log and use defaults if possible,
    // or arguably failing to create context is better than running with bad config.
    // Given Zero-Trust, we should probably fail safe.
    originalContext.logger.error(`Failed to load tenant settings for ${botInstance.tenantId}`, tenantResult.error);
    throw new Error('Failed to load tenant configuration');
  }
  const tenantSettings: TenantSettings = tenantResult.data;

  // Reply via Baileys in production; fallback to HTTP simulation
  const reply = async (content: any) => {
    const messageContent = typeof content === 'string' ? { text: content } : content;
    if (useDirectBaileys && botInstance?.sendMessage) {
      return await botInstance.sendMessage(remoteJid, messageContent, { quoted: rawBaileysMessage });
    }
  };

  const replyReact = async (emoji: string) => {
    if (useDirectBaileys && botInstance?.sendMessage) {
      return await botInstance.sendMessage(remoteJid, { react: { text: emoji, key: rawBaileysMessage.key } });
    }
  };

  const simulateTyping = async () => {
    if (useDirectBaileys && botInstance?.sendPresenceUpdate) { // removed presenceSubscribe check as it's not always needed/available on lightweight types
      try {
        await botInstance.sendPresenceUpdate('composing', remoteJid);
        setTimeout(() => botInstance.sendPresenceUpdate?.('paused', remoteJid).catch(() => { }), 1500);
      } catch (_) { /* ignore */ }
    }
  };

  // Implement ctx.group() methods
  const group = (jid = groupId) => ({
    isAdmin: async (userJid: string = senderId) => {
      // @ts-ignore
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
      // @ts-ignore
      if (!jid || !botInstance.tenantId) return false;
      const botJid = botInstance.user?.id?.split(':')[0] + '@s.whatsapp.net'; // derive from bot user
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
      // @ts-ignore
      if (!jid || !botInstance.tenantId) return [];
      try {
        const membersSnapshot = await db.collection('tenants').doc(botInstance.tenantId).collection('groups').doc(jid).collection('members').get();
        return membersSnapshot.docs.map(doc => doc.id);
      } catch (e) { return []; }
    },
    metadata: async () => {
      // @ts-ignore - baileys type mismatch workaround
      if (!jid || !botInstance?.groupMetadata) return null;
      return await botInstance.groupMetadata(jid);
    },
    owner: async () => {
      // @ts-ignore
      if (!jid || !botInstance?.groupMetadata) return null;
      const meta = await botInstance.groupMetadata(jid);
      return meta.owner || null;
    },
    name: async () => {
      // @ts-ignore
      if (!jid || !botInstance?.groupMetadata) return '';
      const meta = await botInstance.groupMetadata(jid);
      return meta.subject || '';
    },
    add: async (jids: string[]) => {
      // @ts-ignore
      if (!jid || !botInstance?.groupParticipantsUpdate) return null;
      return await botInstance.groupParticipantsUpdate(jid, jids, 'add');
    },
    kick: async (jids: string[]) => {
      // @ts-ignore
      if (!jid || !botInstance?.groupParticipantsUpdate) return null;
      return await botInstance.groupParticipantsUpdate(jid, jids, 'remove');
    },
    promote: async (jids: string[]) => {
      // @ts-ignore
      if (!jid || !botInstance?.groupParticipantsUpdate) return null;
      return await botInstance.groupParticipantsUpdate(jid, jids, 'promote');
    },
    demote: async (jids: string[]) => {
      // @ts-ignore
      if (!jid || !botInstance?.groupParticipantsUpdate) return null;
      return await botInstance.groupParticipantsUpdate(jid, jids, 'demote');
    },
    inviteCode: async () => {
      // @ts-ignore
      if (!jid || !botInstance?.groupInviteCode) return '';
      const code = await botInstance.groupInviteCode(jid);
      return code || '';
    },
    pendingMembers: async () => [],
    approvePendingMembers: async (jids: string[]) => null,
    rejectPendingMembers: async (jids: string[]) => null,
    updateDescription: async (desc: string) => {
      // @ts-ignore
      if (!jid || !botInstance?.groupUpdateDescription) return null;
      return await botInstance.groupUpdateDescription(jid, desc);
    },
    updateSubject: async (subject: string) => {
      // @ts-ignore
      if (!jid || !botInstance?.groupUpdateSubject) return null;
      return await botInstance.groupUpdateSubject(jid, subject);
    },
    joinApproval: async (mode: 'on' | 'off') => {
      // @ts-ignore
      if (!jid || !botInstance?.groupJoinApprovalMode) return null;
      return await botInstance.groupJoinApprovalMode(jid, mode);
    },
    membersCanAddMemberMode: async (mode: 'on' | 'off') => {
      // @ts-ignore
      if (!jid || !botInstance?.groupMemberAddMode) return null;
      const val = mode === 'on' ? 'all_member_add' : 'admin_add';
      return await botInstance.groupMemberAddMode(jid, val);
    },
    open: async () => {
      // @ts-ignore
      if (!jid || !botInstance?.groupSettingUpdate) return null;
      return await botInstance.groupSettingUpdate(jid, 'not_announcement');
    },
    close: async () => {
      // @ts-ignore
      if (!jid || !botInstance?.groupSettingUpdate) return null;
      return await botInstance.groupSettingUpdate(jid, 'announcement');
    },
    unlock: async () => {
      // @ts-ignore
      if (!jid || !botInstance?.groupSettingUpdate) return null;
      return await botInstance.groupSettingUpdate(jid, 'unlocked');
    },
    lock: async () => {
      // @ts-ignore
      if (!jid || !botInstance?.groupSettingUpdate) return null;
      return await botInstance.groupSettingUpdate(jid, 'locked');
    },
    isOwner: async (userJid: string) => {
      // @ts-ignore
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
  if (botInstance.config?.autoRead && rawBaileysMessage.key?.remoteJid) { // Fixed: safely access key
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
    originalContext.bot?.cmd?.get(commandName);

  // Validate Owner
  // Use tenantSettings.ownerNumber if available
  const ownerNumber = tenantSettings.ownerNumber || 'system';
  const isOwner = tools.cmd.isOwner([ownerNumber], senderId, rawBaileysMessage.key?.id || ''); // Fixed: unsafe key access

  // Resolve null mismatch by properly calling the function
  const isAdmin = isGroup ? await group().isAdmin(senderId) : false;

  const ctx: MessageContext = {
    bot: botInstance,
    msg: rawBaileysMessage,
    isGroup: () => isGroup,
    // isPrivate: () => !isGroup, // removed as it wasn't in interface
    id: groupId || remoteJid, // Use group ID or remote JID
    sender: {
      jid: senderJid,
      name: rawBaileysMessage.pushName || 'Unknown',
      pushName: rawBaileysMessage.pushName,
      isOwner,
      isAdmin
    },
    getId: (jid: string) => getJid(jid),
    group,
    reply,
    replyReact,
    simulateTyping,
    used,
    command: used.command,
    prefix: used.prefix,
    args: used.args,
    body: messageBody,
    tenant: tenantSettings, // 2026: Inject Tenant Settings directly
    isOwner,
    isAdmin,
    cooldown: {},
    sendMessage: async (jid: string, content: any, options: any = {}) => {
      if (botInstance?.sendMessage) {
        return await botInstance.sendMessage(jid, content, options);
      }
    },
    download: async () => {
      const quotedMsg = rawBaileysMessage.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      // Fixed: Implicit any indexing
      const messageToDownload = quotedMsg ?
        { [Object.keys(quotedMsg)[0]]: (quotedMsg as any)[Object.keys(quotedMsg)[0]] } :
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

  return ctx;
};

export { createBotContext };
export default createBotContext;

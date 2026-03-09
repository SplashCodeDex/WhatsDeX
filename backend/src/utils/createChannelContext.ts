import { db } from '../lib/firebase.js';
import { downloadContentFromMessage, getContentType, type proto } from 'baileys';
import { getJid, getSender, getGroup } from './baileysUtils.js';
import type { ActiveChannel, GlobalContext, MessageContext } from '../types/index.js';
import type { TenantSettings } from '../types/tenantConfig.js';
import { DeliberationService } from './deliberation.js';

const createChannelContext = async (
  channelInstance: ActiveChannel,
  rawBaileysMessage: proto.IWebMessageInfo,
  originalContext: GlobalContext,
  requestInfo: any = {}
): Promise<MessageContext> => {
  const { tools, config } = originalContext;

  const senderJid = getSender(rawBaileysMessage);
  const senderId = getSender(rawBaileysMessage);
  const remoteJid = rawBaileysMessage.key?.remoteJid || '';
  const isGroup = remoteJid.endsWith('@g.us');
  const groupJid = getGroup(rawBaileysMessage);
  const groupId = getGroup(rawBaileysMessage);

  const useDirectBaileys = process.env.USE_BAILEYS_DIRECT === 'true' || process.env.NODE_ENV === 'production';

  // Fetch tenant settings strictly
  const tenantResult = await originalContext.tenantConfigService.getTenantSettings(channelInstance.tenantId);
  if (!tenantResult.success) {
    // In strict mode, we might want to throw, but for resilience, we'll log and use defaults if possible,
    // or arguably failing to create context is better than running with bad config.
    // Given Zero-Trust, we should probably fail safe.
    originalContext.logger.error(`Failed to load tenant settings for ${channelInstance.tenantId}`, tenantResult.error);
    throw new Error('Failed to load tenant configuration');
  }
  const tenantSettings: TenantSettings = tenantResult.data;

  // Surgical Migration: Resolve Agent-Channel Configuration
  // This bridges the legacy "Bot" concept with the new hierarchy.
  const resolvedResult = await originalContext.tenantConfigService.resolveAgentChannelConfig(channelInstance.tenantId, channelInstance.channelId);
  if (resolvedResult.success) {
    // Inject resolved config into channelInstance for downstream consumers (AI, Commands)
    channelInstance.config = resolvedResult.data;
    originalContext.logger.info(`[createChannelContext] Resolved Agent-Channel config for ${channelInstance.channelId}`);
  } else {
    originalContext.logger.warn(`[createChannelContext] Config resolution failed for ${channelInstance.channelId}, using fallback.`, resolvedResult.error);
  }

  // Reply via Baileys in production; fallback to HTTP simulation
  const reply = async (content: any) => {
    const messageContent = typeof content === 'string' ? { text: content } : content;
    if (useDirectBaileys && channelInstance?.sendMessage) {
      return await channelInstance.sendMessage(remoteJid, messageContent, { quoted: rawBaileysMessage });
    }
  };

  const replyReact = async (emoji: string) => {
    if (useDirectBaileys && channelInstance?.sendMessage) {
      return await channelInstance.sendMessage(remoteJid, { react: { text: emoji, key: rawBaileysMessage.key } });
    }
  };

  const simulateTyping = async (text?: string | number) => {
    if (useDirectBaileys && channelInstance?.sendPresenceUpdate) {
      try {
        await channelInstance.sendPresenceUpdate('composing', remoteJid);

        let delay = 1500;
        if (typeof text === 'string') {
          delay = DeliberationService.getTypingDelay(text);
        } else if (typeof text === 'number') {
          delay = text;
        } else {
          delay = DeliberationService.getThinkingJitter();
        }

        setTimeout(() => channelInstance.sendPresenceUpdate?.('paused', remoteJid).catch(() => { }), delay);
      } catch (_) { /* ignore */ }
    }
  };

  const sendPresenceUpdate = async (presence: any, jid: string = remoteJid) => {
    if (useDirectBaileys && channelInstance?.sendPresenceUpdate) {
      try {
        await channelInstance.sendPresenceUpdate(presence, jid);
      } catch (_) { /* ignore */ }
    }
  };

  // Implement ctx.group() methods
  const group = (jid = groupId) => ({
    isAdmin: async (userJid: string = senderId) => {
      // @ts-ignore
      if (!jid || !channelInstance.tenantId) return false;
      try {
        const memberSnapshot = await db.collection('tenants').doc(channelInstance.tenantId).collection('groups').doc(jid).collection('members').doc(userJid).get();
        if (memberSnapshot.exists) {
          const role = memberSnapshot.data()?.role;
          return role === 'admin' || role === 'superadmin';
        }
      } catch (e) { }
      return false;
    },
    isChannelAdmin: async () => {
      // @ts-ignore
      if (!jid || !channelInstance.tenantId) return false;
      const channelJid = channelInstance.user?.id?.split(':')[0] + '@s.whatsapp.net'; // derive from channel user
      if (!channelJid) return false;
      try {
        const memberSnapshot = await db.collection('tenants').doc(channelInstance.tenantId).collection('groups').doc(jid).collection('members').doc(channelJid).get();
        if (memberSnapshot.exists) {
          const role = memberSnapshot.data()?.role;
          return role === 'admin' || role === 'superadmin';
        }
      } catch (e) { }
      return false;
    },
    members: async () => {
      // @ts-ignore
      if (!jid || !channelInstance.tenantId) return [];
      try {
        const membersSnapshot = await db.collection('tenants').doc(channelInstance.tenantId).collection('groups').doc(jid).collection('members').get();
        return membersSnapshot.docs.map(doc => doc.id);
      } catch (e) { return []; }
    },
    metadata: async () => {
      // @ts-ignore - baileys type mismatch workaround
      if (!jid || !channelInstance?.groupMetadata) return null;
      return await channelInstance.groupMetadata(jid);
    },
    owner: async () => {
      // @ts-ignore
      if (!jid || !channelInstance?.groupMetadata) return null;
      const meta = await channelInstance.groupMetadata(jid);
      return meta.owner || null;
    },
    name: async () => {
      // @ts-ignore
      if (!jid || !channelInstance?.groupMetadata) return '';
      const meta = await channelInstance.groupMetadata(jid);
      return meta.subject || '';
    },
    add: async (jids: string[]) => {
      // @ts-ignore
      if (!jid || !channelInstance?.groupParticipantsUpdate) return null;
      return await channelInstance.groupParticipantsUpdate(jid, jids, 'add');
    },
    kick: async (jids: string[]) => {
      // @ts-ignore
      if (!jid || !channelInstance?.groupParticipantsUpdate) return null;
      return await channelInstance.groupParticipantsUpdate(jid, jids, 'remove');
    },
    promote: async (jids: string[]) => {
      // @ts-ignore
      if (!jid || !channelInstance?.groupParticipantsUpdate) return null;
      return await channelInstance.groupParticipantsUpdate(jid, jids, 'promote');
    },
    demote: async (jids: string[]) => {
      // @ts-ignore
      if (!jid || !channelInstance?.groupParticipantsUpdate) return null;
      return await channelInstance.groupParticipantsUpdate(jid, jids, 'demote');
    },
    inviteCode: async () => {
      // @ts-ignore
      if (!jid || !channelInstance?.groupInviteCode) return '';
      const code = await channelInstance.groupInviteCode(jid);
      return code || '';
    },
    pendingMembers: async () => [],
    approvePendingMembers: async (jids: string[]) => null,
    rejectPendingMembers: async (jids: string[]) => null,
    updateDescription: async (desc: string) => {
      // @ts-ignore
      if (!jid || !channelInstance?.groupUpdateDescription) return null;
      return await channelInstance.groupUpdateDescription(jid, desc);
    },
    updateSubject: async (subject: string) => {
      // @ts-ignore
      if (!jid || !channelInstance?.groupUpdateSubject) return null;
      return await channelInstance.groupUpdateSubject(jid, subject);
    },
    joinApproval: async (mode: 'on' | 'off') => {
      // @ts-ignore
      if (!jid || !channelInstance?.groupJoinApprovalMode) return null;
      return await channelInstance.groupJoinApprovalMode(jid, mode);
    },
    membersCanAddMemberMode: async (mode: 'on' | 'off') => {
      // @ts-ignore
      if (!jid || !channelInstance?.groupMemberAddMode) return null;
      const val = mode === 'on' ? 'all_member_add' : 'admin_add';
      return await channelInstance.groupMemberAddMode(jid, val);
    },
    open: async () => {
      // @ts-ignore
      if (!jid || !channelInstance?.groupSettingUpdate) return null;
      return await channelInstance.groupSettingUpdate(jid, 'not_announcement');
    },
    close: async () => {
      // @ts-ignore
      if (!jid || !channelInstance?.groupSettingUpdate) return null;
      return await channelInstance.groupSettingUpdate(jid, 'announcement');
    },
    unlock: async () => {
      // @ts-ignore
      if (!jid || !channelInstance?.groupSettingUpdate) return null;
      return await channelInstance.groupSettingUpdate(jid, 'unlocked');
    },
    lock: async () => {
      // @ts-ignore
      if (!jid || !channelInstance?.groupSettingUpdate) return null;
      return await channelInstance.groupSettingUpdate(jid, 'locked');
    },
    isOwner: async (userJid: string = senderId) => {
      // @ts-ignore
      if (!jid || !channelInstance.tenantId || !channelInstance.groupMetadata) return false;
      const meta = await channelInstance.groupMetadata(jid);
      return meta.owner === userJid;
    },
    matchAdmin: async (userJid: string) => {
      // Logic same as isAdmin for now
      if (!jid || !channelInstance.tenantId) return false;
      try {
        const memberSnapshot = await db.collection('tenants').doc(channelInstance.tenantId).collection('groups').doc(jid).collection('members').doc(userJid).get();
        if (memberSnapshot.exists) {
          const role = memberSnapshot.data()?.role;
          return role === 'admin' || role === 'superadmin';
        }
      } catch (e) { }
      return false;
    }
  });

  // Determine the prefix to use: Priority given to ChannelConfig
  const prefixes = channelInstance.config?.prefix || [config.channel.prefix];
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
  if (channelInstance.config?.autoRead && rawBaileysMessage.key?.remoteJid && channelInstance.readMessages) { // Fixed: safely access key and method
    channelInstance.readMessages([rawBaileysMessage.key]).catch(() => { });
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
    originalContext.channel?.cmd?.get(commandName);

  // Validate Owner
  // Use tenantSettings.ownerNumber if available
  const ownerNumber = tenantSettings.ownerNumber || 'system';
  const isOwner = tools.cmd.isOwner([ownerNumber], senderId, rawBaileysMessage.key?.id || ''); // Fixed: unsafe key access

  // Resolve null mismatch by properly calling the function
  const isAdmin = isGroup ? await group().isAdmin(senderId) : false;

  const ctx: MessageContext = {
    channel: channelInstance,
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
    sendPresenceUpdate,
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
      if (channelInstance?.sendMessage) {
        return await channelInstance.sendMessage(jid, content, options);
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

export { createChannelContext };
export default createChannelContext;

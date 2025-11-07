const moment = require('moment-timezone'); // Assuming moment-timezone is used
const { getJid, getSender, getGroup } = require('./baileysUtils');
const { Cooldown } = require('../middleware/cooldown.js'); // Re-adding the import

const createBotContext = async (
  botInstance,
  rawBaileysMessage,
  originalContext,
  requestInfo = {}
) => {
  const { database, tools, config, formatter } = originalContext;

  const senderJid = getSender(rawBaileysMessage);
  const senderId = getSender(rawBaileysMessage);
  const isGroup = rawBaileysMessage.key.remoteJid.endsWith('@g.us');
  const groupJid = getGroup(rawBaileysMessage);
  const groupId = getGroup(rawBaileysMessage);

  // Instantiate Cooldown
  const cooldown = new Cooldown(); // New: Instantiate Cooldown

  // Simulate ctx.reply
  const reply = async content => {
    const messageContent = typeof content === 'string' ? { text: content } : content;
    // This will call the Next.js API route to send the message
    await fetch(`${process.env.BOT_SERVICE_URL}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: rawBaileysMessage.key.remoteJid, message: messageContent }),
    });
  };

  // Simulate ctx.replyReact
  const replyReact = async emoji => {
    // This will call the Next.js API route to send a reaction
    await fetch(`${process.env.BOT_SERVICE_URL}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: rawBaileysMessage.key.remoteJid,
        message: { react: { text: emoji, key: rawBaileysMessage.key } },
      }),
    });
  };

  // Simulate ctx.simulateTyping
  const simulateTyping = async () => {
    // This will call the Next.js API route to send a typing status
    await fetch(`${process.env.BOT_SERVICE_URL}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: rawBaileysMessage.key.remoteJid, message: { typing: true } }),
    });
  };

  // Implement ctx.group() methods using Prisma
  const group = (jid = groupId) => ({
    isAdmin: async userJid => {
      if (!jid) return false; // Not a group
      const user = await database.prisma.user.findUnique({ where: { jid: userJid } });
      if (!user) return false;
      const userGroup = await database.prisma.userGroup.findUnique({
        where: { userId_groupId: { userId: user.id, groupId: jid } },
      });
      return userGroup ? userGroup.role === 'admin' || userGroup.role === 'owner' : false;
    },
    isBotAdmin: async () => {
      if (!jid) return false; // Not a group
      const botJid = config.bot.jid; // Assuming bot JID is in config
      const botUser = await database.prisma.user.findUnique({ where: { jid: botJid } });
      if (!botUser) return false;
      const botUserGroup = await database.prisma.userGroup.findUnique({
        where: { userId_groupId: { userId: botUser.id, groupId: jid } },
      });
      return botUserGroup ? botUserGroup.role === 'admin' || botUserGroup.role === 'owner' : false;
    },
    members: async () => {
      if (!jid) return []; // Not a group
      const groupMembers = await database.prisma.userGroup.findMany({
        where: { groupId: jid },
        include: { user: true },
      });
      return groupMembers.map(gm => ({
        jid: gm.user.jid,
        id: gm.user.id,
        role: gm.role,
      }));
    },
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

  // Simulate ctx.bot.cmd.get
  const getCommand = commandName =>
    // This assumes originalContext.bot.cmd is available and has a get method
    originalContext.bot.cmd.get(commandName);
  const ctx = {
    bot: {
      ...botInstance,
      cmd: {
        get: getCommand,
        values: () => originalContext.bot.cmd.values(), // Assuming this is needed
      },
      context: originalContext, // Provide access to original context
    },
    msg: rawBaileysMessage,
    isGroup: () => isGroup,
    isPrivate: () => !isGroup,
    groupId, // Add groupId to ctx
    sender: { jid: senderJid, id: senderId }, // Assuming senderId is also needed
    getId: jid => getJid(jid),
    group,
    reply,
    replyReact,
    simulateTyping,
    used,
    cooldown, // New: Add cooldown instance to ctx
    // Add other properties as needed based on your middleware's usage
    ip: requestInfo.ip || 'unknown',
    userAgent: requestInfo.userAgent || 'WhatsApp',
    sessionId: requestInfo.sessionId || 'unknown',
    location: requestInfo.location || 'unknown',
  };

  // Re-evaluate isOwner and isAdmin based on the new ctx structure
  const isOwner = tools.cmd.isOwner(config, senderId, rawBaileysMessage.key.id);
  const isAdmin = isGroup ? await ctx.group().isAdmin(senderId) : false; // Use senderId for isAdmin check

  // Add these to ctx if they are used directly by commands
  ctx.isOwner = isOwner;
  ctx.isAdmin = isAdmin;

  return ctx;
};

module.exports = createBotContext;

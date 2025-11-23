import moment from 'moment-timezone';
import crypto from 'crypto';

export const parseFlag = (args, options) => {
  const result = { input: args };
  if (!options) return result;
  Object.keys(options).forEach(flag => {
    if (args.includes(flag)) {
      // Logic to extract value could be added here
    }
  });
  return result;
};

export const isCmd = (config, content, bot) => {
  if (!content) return false;
  const prefixes = config.bot.prefix || ['.', '!', '/'];
  const prefix = prefixes.find(p => content.startsWith(p));

  if (!prefix) return false;

  const [commandName, ...args] = content.slice(prefix.length).trim().split(/\s+/);
  return {
    prefix,
    name: commandName.toLowerCase(),
    args,
    input: args.join(' '),
    didyoumean: false // Placeholder for didyoumean logic
  };
};

export const isOwner = (config, senderId, messageId) => {
  // Normalize senderId (remove @s.whatsapp.net if present)
  const id = senderId.replace('@s.whatsapp.net', '');
  const ownerNumber = config.auth.ownerNumber.replace('+', '');

  return id === ownerNumber || config.auth.adminNumbers.includes(id);
};

export const generateUID = (config, senderId) => {
  const id = senderId.replace('@s.whatsapp.net', '');
  // Simple hash or just return the number
  return crypto.createHash('md5').update(id).digest('hex').substring(0, 8);
};

export const fakeMetaAiQuotedText = (text) => {
  return {
    key: {
      fromMe: false,
      participant: '0@s.whatsapp.net',
      remoteJid: 'status@broadcast'
    },
    message: {
      conversation: text
    }
  };
};

export default {
  parseFlag,
  isCmd,
  isOwner,
  generateUID,
  fakeMetaAiQuotedText
};

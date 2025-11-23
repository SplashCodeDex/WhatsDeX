import moment from 'moment-timezone';
import crypto from 'crypto';
import { levenshteinDistance } from '../src/utils/levenshtein.js';

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
  const name = commandName.toLowerCase();

  // Check for exact match
  // bot.cmd is the Map of commands
  const commands = bot?.cmd;
  const command = commands?.get(name);

  if (command) {
    return {
      prefix,
      name: name,
      args,
      input: args.join(' '),
      didyoumean: false
    };
  }

  // If no exact match, check for suggestions
  let didyoumean = false;
  if (commands) {
    const commandNames = Array.from(commands.keys());
    let closestDistance = Infinity;
    let closestMatch = null;

    for (const cmdName of commandNames) {
      // Skip aliases for suggestions to avoid clutter, or include them?
      // UnifiedCommandSystem filters aliases. Let's check if we can distinguish.
      // The Map values have 'isAlias' property.
      const cmdObj = commands.get(cmdName);
      if (cmdObj.isAlias) continue;

      const distance = levenshteinDistance(name, cmdName);
      if (distance < closestDistance && distance <= 2) {
        closestDistance = distance;
        closestMatch = cmdName;
      }
    }

    if (closestMatch) {
      didyoumean = closestMatch;
    }
  }

  return {
    prefix,
    name: name,
    args,
    input: args.join(' '),
    didyoumean
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

export const handleError = async (ctx, error) => {
  console.error('Command Error:', error);
  await ctx.reply(`❌ An error occurred: ${error.message}`);
};

export default {
  parseFlag,
  isCmd,
  isOwner,
  generateUID,
  fakeMetaAiQuotedText,
  handleError
};

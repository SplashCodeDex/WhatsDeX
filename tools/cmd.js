import { jidDecode, proto, getContentType, S_WHATSAPP_NET, STORIES_JID, META_AI_JID } from '@whiskeysockets/baileys';
import axios from 'axios';
import didYouMean from 'didyoumean';
import util from 'node:util';
import * as api from './api.js';
import config from '../config.js';
import * as formatter from '../utils/formatter.js';

const formatBotName = botName => {
  if (!botName) return null;
  botName = botName.toLowerCase();
  return botName.replace(/[aiueo0-9\W_]/g, '');
};

function checkMedia(message, required) {
  if (!message || !required) return false;

  const type = getContentType(message);
  const mediaList = Array.isArray(required) ? required : [required];

  for (const media of mediaList) {
    if (type === media) return media;
    if (type === 'extendedTextMessage' && media === 'text') return media;
    if (type === 'videoMessage' && media === 'gif') return media;
    if (type === 'documentWithCaptionMessage' && media === 'document') return media;
  }

  return false;
}

function checkQuotedMedia(message, required) {
  if (!message || !required) return false;

  const quoted = message.extendedTextMessage?.contextInfo?.quotedMessage;
  if (!quoted) return false;

  const type = getContentType(quoted);
  const mediaList = Array.isArray(required) ? required : [required];

  for (const media of mediaList) {
    if (type === media) return media;
    if (type === 'extendedTextMessage' && media === 'text') return media;
    if (type === 'videoMessage' && media === 'gif') return media;
    if (type === 'documentWithCaptionMessage' && media === 'document') return media;
  }

  return false;
}

function fakeMetaAiQuotedText(text) {
  if (!text) return null;

  const quoted = {
    key: {
      remoteJid: STORIES_JID,
      participant: META_AI_JID,
    },
    message: {
      conversation: text,
    },
  };
  return quoted;
}

function generateUID(config, id, withBotName = true) {
  if (!id) return null;

  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const charCode = id.charCodeAt(i);
    hash = (hash * 31 + charCode) % 1000000007;
  }

  const uniquePart = id.split('').reverse().join('').charCodeAt(0).toString(16);
  let uid = `${Math.abs(hash).toString(16).toLowerCase()}-${uniquePart}`;
  if (withBotName) uid += `_${formatBotName(config.bot.name)}-wabot`;

  return uid;
}

function getRandomElement(array) {
  if (!array || !array.length) return null;

  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

async function handleError(ctx, error, useAxios = false, reportErrorToOwner = true) {
  const { config, formatter } = ctx.bot.context;
  const { isGroup } = ctx;
  const groupJid = isGroup ? ctx.id : null;
  const groupSubject = isGroup ? await ctx.group(groupJid).name() : null;
  const errorText = util.format(error);

  console.error(`Error: ${errorText}`);
  if (config.system.reportErrorToOwner && reportErrorToOwner)
    await ctx.replyWithJid(config.owner.id + S_WHATSAPP_NET, {
      text:
        `${formatter.quote(isGroup ? `⚠️ Terjadi kesalahan dari grup: @${groupJid}, oleh: @${ctx.getId(ctx.sender.jid)}` : `⚠️ Terjadi kesalahan dari: @${ctx.getId(ctx.sender.jid)}`)}
` +
        `${formatter.quote('· · ─ ·✶· ─ · ·')}
${formatter.monospace(errorText)}`,
      mentions: [ctx.sender.jid],
      contextInfo: {
        groupMentions: isGroup
          ? [
              {
                groupJid,
                groupSubject,
              },
            ]
          : [],
      },
    });
  if (useAxios && error.status !== 200) return await ctx.reply(config.msg.notFound);
  await ctx.reply(formatter.quote(`⚠️ Terjadi kesalahan: ${error.message}`));
}

function isCmd(config, content, bot) {
  if (!content || !bot) return null;

  const prefix = content.charAt(0);
  if (!new RegExp(bot.prefix, 'i').test(content)) return false;

  const [cmdName, ...inputArray] = content.slice(1).trim().toLowerCase().split(/\s+/);
  const input = inputArray.join(' ');

  const cmds = Array.from(bot.cmd.values());
  const matchedCmd = cmds.find(cmd => cmd.name === cmdName || cmd.aliases?.includes(cmdName));

  if (matchedCmd)
    return {
      msg: content,
      prefix,
      name: cmdName,
      input,
    };

  const mean = didYouMean(
    cmdName,
    cmds.flatMap(cmd => [cmd.name, ...(cmd.aliases || [])])
  );
  return mean
    ? {
        msg: content,
        prefix,
        didyoumean: mean,
        input,
      }
    : false;
}

import prisma from '../src/lib/prisma.js';

async function isOwner(configOrId, maybeId, maybeMessageId) {
  // Backward/forgiving signature handling:
  // - isOwner(config, id, messageId)
  // - isOwner(id, messageId)
  let config;
  let id;
  let messageId;

  if (typeof configOrId === 'object' && configOrId !== null && 'bot' in configOrId) {
    config = configOrId;
    id = maybeId;
    messageId = maybeMessageId;
  } else {
    id = configOrId;
    messageId = maybeId;
    // Lazy global config fallback if available
    // eslint-disable-next-line no-undef
    config = typeof global !== 'undefined' && global.config ? global.config : { owner: { id: '', co: [] }, bot: { id: '' }, system: {} };
  }

  if (!id) return false;

  try {
    // Primary: DB-backed ownership (BotUser.role owner/admin)
    const dbOwner = await prisma.botUser.findFirst({
      where: { jid: id, role: { in: ['owner', 'admin'] } },
      select: { id: true },
    });
    if (dbOwner) return true;
  } catch (e) {
    // Fall through to config-based logic
  }

  // Backward-compatible config/env-based logic
  if (
    config?.system?.selfOwner ||
    config?.bot?.id === config?.owner?.id ||
    (Array.isArray(config?.owner?.co) && config.owner.co.includes(config?.bot?.id))
  ) {
    if (messageId && String(messageId).startsWith('3EB0')) return false; // Anti rce/injection (aka backdoor)
    return (
      config?.bot?.id === id ||
      config?.owner?.id === id ||
      (Array.isArray(config?.owner?.co) && config.owner.co.includes(id))
    );
  }

  return (
    config?.owner?.id === id ||
    (Array.isArray(config?.owner?.co) && config.owner.co.includes(id))
  );
}

function isUrl(url) {
  if (!url) return false;

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return urlRegex.test(url);
}

function parseFlag(argsString, customRules = {}) {
  if (!argsString)
    return {
      input: null,
    };

  const options = {};
  const input = [];
  const args = argsString.trim().split(/\s+/);

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (customRules[arg]) {
      const rule = customRules[arg];

      if (rule.type === 'value') {
        const value = args[i + 1];

        if (value && rule.validator(value)) {
          options[rule.key] = rule.parser(value);
          i++;
        } else {
          options[rule.key] = rule.default || null;
        }
      } else if (rule.type === 'boolean') {
        options[rule.key] = true;
      }
    } else {
      input.push(arg);
    }
  }

  options.input = input.join(' ');
  return options;
}

async function translate(text, to) {
  if (!text || !to) return null;

  try {
    const apiUrl = api.createUrl('davidcyril', '/tools/translate', {
      text,
      to,
    });
    const result = (await axios.get(apiUrl)).data.translated_text;
    return result;
  } catch (error) {
    consolefy.error(`Error: ${util.format(error)}`);
    return null;
  }
}

/**
 * RESTORED: Sophisticated command loading system
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadCommands(bot) {
  const commandsDir = path.join(__dirname, '..', 'commands');
  bot.cmd = new Map();
  
  console.log('🔄 Loading sophisticated command system...');
  
  try {
    const categories = await fs.readdir(commandsDir, { withFileTypes: true });
    let totalCommands = 0;
    
    for (const category of categories) {
      if (category.isDirectory()) {
        const categoryPath = path.join(commandsDir, category.name);
        const commandFiles = await fs.readdir(categoryPath);
        
        console.log(`📂 Loading category: ${category.name}`);
        
        for (const file of commandFiles) {
          if (file.endsWith('.js')) {
            try {
              const commandPath = path.join(categoryPath, file);
              const relativePath = path.relative(__dirname, commandPath);
              
              // Import the command module
              const commandModule = await import(`../${relativePath}`);
              const command = commandModule.default;
              
              if (command && command.name && typeof command.code === 'function') {
                bot.cmd.set(command.name, {
                  ...command,
                  category: category.name,
                  filePath: relativePath
                });
                
                // Register aliases
                if (command.aliases && Array.isArray(command.aliases)) {
                  command.aliases.forEach(alias => {
                    bot.cmd.set(alias, command);
                  });
                }
                
                totalCommands++;
                console.log(`  ✅ ${command.name}`);
              }
            } catch (error) {
              console.error(`  ❌ Error loading ${file}:`, error.message);
            }
          }
        }
      }
    }
    
    console.log(`🎉 Successfully loaded ${totalCommands} sophisticated commands`);
    
  } catch (error) {
    console.error('❌ Command loading failed:', error.message);
    throw error;
  }
}

export {
  checkMedia,
  checkQuotedMedia,
  fakeMetaAiQuotedText,
  generateUID,
  getRandomElement,
  handleError,
  isCmd,
  isOwner,
  isUrl,
  loadCommands,  // RESTORED: Export sophisticated command loader
  parseFlag,
  translate,
};

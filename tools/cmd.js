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

function isOwner(config, id, messageId) {
  if (!id) return false;

  if (
    config.system.selfOwner ||
    config.bot.id === config.owner.id ||
    config.owner.co.includes(config.bot.id)
  ) {
    if (messageId.startsWith('3EB0')) return false; // Anti rce/injection (aka backdoor) ygy
    return config.bot.id === id || config.owner.id === id || config.owner.co.includes(id);
  }

  return config.owner.id === id || config.owner.co.includes(id);
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
  parseFlag,
  translate,
};

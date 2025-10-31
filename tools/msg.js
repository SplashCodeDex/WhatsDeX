const formatter = require('../utils/formatter.js');

const bytes = [
  'yBytes',
  'zBytes',
  'aBytes',
  'fBytes',
  'pBytes',
  'nBytes',
  'µBytes',
  'mBytes',
  'Bytes',
  'KiB',
  'MiB',
  'GiB',
  'TiB',
  'PiB',
  'EiB',
  'ZiB',
  'YiB',
];

function convertMsToDuration(ms, units = []) {
  if (!ms || ms <= 0) return '0 days';

  const timeUnits = {
    year: 31557600000,
    month: 2629800000,
    week: 604800000,
    day: 86400000,
    hour: 3600000,
    minute: 60000,
    second: 1000,
    millisecond: 1,
  };

  if (units.length > 0) {
    const result = [];
    for (const unit of units) {
      if (timeUnits[unit]) {
        const value = Math.floor(ms / timeUnits[unit]);
        if (value > 0) result.push(`${value} ${unit}`);
        ms %= timeUnits[unit];
      }
    }
    return result.join(' ') || `0 ${units[0]}`;
  }

  const result = [];
  for (const [unit, duration] of Object.entries(timeUnits)) {
    const value = Math.floor(ms / duration);
    if (value > 0) {
      result.push(`${value} ${unit}`);
      ms %= duration;
    }
  }
  return result.join(' ') || '0 seconds';
}

function formatSize(byteCount) {
  if (!byteCount) return '0 Bytes';

  let index = 8;
  let size = byteCount;

  while (size < 1 && index > 0) {
    size *= 1024;
    index--;
  }

  while (size >= 1024 && index < bytes.length - 1) {
    size /= 1024;
    index++;
  }

  return `${size.toFixed(2)} ${bytes[index]}`;
}

function formatSizePerSecond(byteCount) {
  if (!byteCount) return '0 Bytes/s';

  let index = 8;
  let size = byteCount;

  while (size < 1 && index > 0) {
    size *= 1024;
    index--;
  }

  while (size >= 1024 && index < bytes.length - 1) {
    size /= 1024;
    index++;
  }

  return `${size.toFixed(2)} ${bytes[index]}/s`;
}

function generateCmdExample(used, args) {
  if (!used) return `${formatter.inlineCode('used')} must be provided!`;
  if (!args) return `${formatter.inlineCode('args')} must be provided!`;

  const cmdMsg = `Example: ${formatter.inlineCode(`${used.prefix + used.command} ${args}`)}`;
  return cmdMsg;
}

function generateInstruction(actions, mediaTypes) {
  if (!actions || !actions.length)
    return `${formatter.inlineCode('actions')} required must be specified!`;

  let translatedMediaTypes;
  if (typeof mediaTypes === 'string') {
    translatedMediaTypes = [mediaTypes];
  } else if (Array.isArray(mediaTypes)) {
    translatedMediaTypes = mediaTypes;
  } else {
    return `${formatter.inlineCode('mediaTypes')} harus berupa string atau array string!`;
  }

  const mediaTypeTranslations = {
    audio: 'audio',
    document: 'document',
    gif: 'GIF',
    image: 'image',
    sticker: 'sticker',
    text: 'text',
    video: 'video',
    viewOnce: 'view once',
  };

  const translatedMediaTypeList = translatedMediaTypes.map(type => mediaTypeTranslations[type]);

  let mediaTypesList;
  if (translatedMediaTypeList.length > 1) {
    const lastMediaType = translatedMediaTypeList[translatedMediaTypeList.length - 1];
    mediaTypesList = `${translatedMediaTypeList.slice(0, -1).join(', ')}, atau ${lastMediaType}`;
  } else {
    mediaTypesList = translatedMediaTypeList[0];
  }

  const actionTranslations = {
    send: 'Send',
    reply: 'Reply',
  };

  const instructions = actions.map(action => `${actionTranslations[action]}`);
  const actionList = instructions.join(actions.length > 1 ? ' or ' : '');
  return `📌 ${actionList} ${mediaTypesList}!`;
}

function generatesFlagInfo(flags) {
  if (typeof flags !== 'object' || !flags)
    return `${formatter.inlineCode('flags')} must be an object!`;

  const flagInfo = `Flags:\n${Object.entries(flags)
    .map(([flag, description]) =>
      formatter.quote(`• ${formatter.inlineCode(flag)}: ${description}`)
    )
    .join('\n')}`;
  return flagInfo;
}

function generateNotes(notes) {
  if (!Array.isArray(notes)) return `${formatter.inlineCode('notes')} must be a string!`;

  const notesMsg = `Notes:\n${notes.map(note => formatter.quote(`• ${note}`)).join('\n')}`;
  return notesMsg;
}

function ucwords(text) {
  if (!text) return null;

  return text.toLowerCase().replace(/\b\w/g, t => t.toUpperCase());
}

module.exports = {
  convertMsToDuration,
  formatSize,
  formatSizePerSecond,
  generateCmdExample,
  generateInstruction,
  generatesFlagInfo,
  generateNotes,
  ucwords,
};

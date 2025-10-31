const quote = text => `> ${text}`;

const bold = text => `*${text}*`;

const italic = text => `_${text}_`;

const monospace = text => `\
\
${text}\
\
`;

const inlineCode = text => `\
${text}\
`;

module.exports = {
  quote,
  bold,
  italic,
  monospace,
  inlineCode,
};

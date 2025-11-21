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

export {
  quote,
  bold,
  italic,
  monospace,
  inlineCode,
};

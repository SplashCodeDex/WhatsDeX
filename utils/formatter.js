
const quote = (text) => {
  return `> ${text}`;
};

const bold = (text) => {
  return `*${text}*`;
};

const italic = (text) => {
  return `_${text}_`;
};

const monospace = (text) => {
  return `\
\
${text}\
\
`;
};

const inlineCode = (text) => {
  return `\
${text}\
`;
};

module.exports = {
  quote,
  bold,
  italic,
  monospace,
  inlineCode,
};

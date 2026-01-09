import { MessageContext } from '../../types/index.js';
export default {
  name: 'proverb',
  category: 'information',
  permissions: {
    coin: 0,
  },
  code: async (ctx: MessageContext) => {
    const proverbs = [
      'The early bird catches the worm.',
      'Actions speak louder than words.',
      'A journey of a thousand miles begins with a single step.',
      'All that glitters is not gold.',
      "Where there's a will, there's a way.",
    ];
    const proverb = proverbs[Math.floor(Math.random() * proverbs.length)];
    return ctx.reply(proverb);
  },
};

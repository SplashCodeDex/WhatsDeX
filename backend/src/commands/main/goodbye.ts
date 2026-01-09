import { MessageContext } from '../../types/index.js';

export default {
  name: 'goodbye',
  category: 'main',
  code: async (ctx: MessageContext) => {
    await ctx.reply('Goodbye! Have a great day!');
  },
};
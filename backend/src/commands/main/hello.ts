import { MessageContext, GlobalContext } from '../../types/index.js';

export default {
  name: 'hello',
  category: 'main',
  handler: async (
    ctx: MessageContext,
    context: GlobalContext
  ) => {
    ctx.reply('Hello! How can I help you today?');
  },
};

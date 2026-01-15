import { MessageContext, GlobalContext, Bot } from '../../types/index.js';

export default async (nlpResult: any, ctx: MessageContext, bot: Bot, context: GlobalContext) => {
  const newMsg = JSON.parse(JSON.stringify(ctx.msg));
  if (newMsg.message) {
    newMsg.message.conversation = `${context.config.bot.prefix}hello`;
  }

  bot.ev.emit('messages.upsert', {
    messages: [newMsg],
    type: 'notify'
  });
};

import { MessageContext, GlobalContext, Bot } from '../../types/index.js';
import commandHandler from './commandHandler.js';
import greetingHandler from './greetingHandler.js';
import farewellHandler from './farewellHandler.js';
import questionHandler from './questionHandler.js';
import defaultHandler from './defaultHandler.js';

export default async (nlpResult: any, ctx: MessageContext, bot: Bot, context: GlobalContext) => {
  switch (nlpResult.intent) {
    case 'command':
      await commandHandler(nlpResult, ctx, bot, context);
      break;
    case 'greeting':
      await greetingHandler(nlpResult, ctx, bot, context);
      break;
    case 'farewell':
      await farewellHandler(nlpResult, ctx, bot, context);
      break;
    case 'question':
      await questionHandler(nlpResult, ctx, bot, context);
      break;
    default:
      await defaultHandler(nlpResult, ctx, bot, context);
      break;
  }
};

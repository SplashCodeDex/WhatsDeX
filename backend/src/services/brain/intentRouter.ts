import commandHandler from './commandHandler';
import greetingHandler from './greetingHandler';
import farewellHandler from './farewellHandler';
import questionHandler from './questionHandler';
import defaultHandler from './defaultHandler';

export default async (nlpResult, ctx, bot, context) => {
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

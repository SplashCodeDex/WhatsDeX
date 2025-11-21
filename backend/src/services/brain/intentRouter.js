const commandHandler = require('./commandHandler');
const greetingHandler = require('./greetingHandler');
const farewellHandler = require('./farewellHandler');
const questionHandler = require('./questionHandler');
const defaultHandler = require('./defaultHandler');

module.exports = async (nlpResult, ctx, bot, context) => {
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

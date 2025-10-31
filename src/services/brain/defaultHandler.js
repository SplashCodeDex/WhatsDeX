const didYouMean = require('didyoumean');

module.exports = async (nlpResult, ctx, bot, context) => {
  const allCommands = [...bot.cmd.values()].flatMap(cmd => [cmd.name, ...(cmd.aliases || [])]);
  const suggestedCommand = didYouMean(nlpResult.command, allCommands);

  if (suggestedCommand) {
    ctx.reply(`I'm sorry, I don't understand. Did you mean "${suggestedCommand}"?`);
  } else {
    ctx.reply(
      "I'm sorry, I don't understand. I am still learning. You can try asking me a question or using a command. To see the list of commands, type /help."
    );
  }
};

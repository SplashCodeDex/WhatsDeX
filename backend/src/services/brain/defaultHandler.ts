import { levenshteinDistance } from '../../utils/levenshtein.js';

export default async (nlpResult: any, ctx: any, bot: any, context: any) => {
  const allCommands = [...bot.cmd.values()].flatMap(cmd => [cmd.name, ...(cmd.aliases || [])]);

  let suggestedCommand = null;
  let minDist = Infinity;
  const threshold = 3;

  for (const cmd of allCommands) {
    const dist = levenshteinDistance(nlpResult.command, cmd);
    if (dist < minDist && dist <= threshold) {
      minDist = dist;
      suggestedCommand = cmd;
    }
  }

  if (suggestedCommand) {
    ctx.reply(`I'm sorry, I don't understand. Did you mean "${suggestedCommand}"?`);
  } else {
    ctx.reply(
      "I'm sorry, I don't understand. I am still learning. You can try asking me a question or using a command. To see the list of commands, type /help."
    );
  }
};

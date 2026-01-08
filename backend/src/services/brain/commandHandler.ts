export default async (nlpResult, ctx, bot, context) => {
  bot.ev.emit('messages.upsert', {
    ...ctx.msg,
    content: `${context.config.bot.prefix}${nlpResult.command} ${nlpResult.args.join(' ')}`,
  });
};

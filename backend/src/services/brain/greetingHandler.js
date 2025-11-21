module.exports = async (nlpResult, ctx, bot, context) => {
  bot.ev.emit('messages.upsert', {
    ...ctx.msg,
    content: `${context.config.bot.prefix}hello`,
  });
};

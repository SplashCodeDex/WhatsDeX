module.exports = async (nlpResult, ctx, bot, context) => {
  bot.ev.emit(require('@itsreimau/gktw').Events.MessagesUpsert, {
    ...ctx.msg,
    content: `${context.config.bot.prefix}goodbye`,
  });
};
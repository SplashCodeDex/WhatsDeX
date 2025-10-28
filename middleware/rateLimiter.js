const userRequests = new Map();

module.exports = async (ctx, { config }) => {
  const now = Date.now();
  const senderJid = ctx.sender.jid;
  const lastRequest = userRequests.get(senderJid);

  if (lastRequest && (now - lastRequest) < config.system.cooldown) {
    await ctx.reply(config.msg.cooldown);
    return false; // Block the command
  }

  userRequests.set(senderJid, now);
  return true; // Proceed with the command
};

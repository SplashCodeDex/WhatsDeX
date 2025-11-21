export default {
  name: 'listpremiumuser',
  aliases: ['listprem', 'listpremium'],
  category: 'owner',
  permissions: {
    owner: true,
  },
  code: async ctx => {
    const { formatter, tools, config, database: db } = ctx.bot.context;
    try {
      const users = await db.get('user');
      const premiumUsers = [];

      for (const userId in users) {
        if (users[userId].premium === true) {
          premiumUsers.push({
            id: userId,
            expiration: users[userId].premiumExpiration,
          });
        }
      }

      let resultText = '';
      const userMentions = [];

      for (const user of premiumUsers) {
        userMentions.push(`${user.id}@s.whatsapp.net`);

        if (user.expiration) {
          const daysLeft = tools.msg.convertMsToDuration(Date.now() - user.expiration, ['hari']);
          resultText += `${formatter.quote(`@${user.id} (${daysLeft} tersisa)`)}
`;
        } else {
          resultText += `${formatter.quote(`@${user.id} (Premium permanen)`)}
`;
        }
      }

      await ctx.reply({
        text: resultText.trim() || config.msg.notFound,
        mentions: userMentions,
        footer: config.msg.footer,
      });
    } catch (error) {
      await tools.cmd.handleError(ctx, error);
    }
  },
};

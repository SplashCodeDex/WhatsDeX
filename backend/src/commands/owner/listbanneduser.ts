import { MessageContext } from '../../types/index.js';
export default {
  name: 'listbanneduser',
  aliases: ['listban', 'listbanned'],
  category: 'owner',
  permissions: {
    owner: true,
  },
  code: async (ctx: MessageContext) => {
    const { formatter, tools, config, database: db } = ctx.bot.context;
    try {
      const users = await db.get('user');
      const bannedUsers = [];

      for (const userId in users) {
        if (users[userId].banned === true) bannedUsers.push(userId);
      }

      let resultText = '';
      const userMentions = [];

      bannedUsers.forEach(userId => {
        resultText += `${formatter.quote(`@${userId}`)}
`;
      });

      bannedUsers.forEach(userId => {
        userMentions.push(`${userId}@s.whatsapp.net`);
      });

      await ctx.reply({
        text: resultText.trim() || config.msg.notFound,
        mentions: userMentions,
        footer: config.msg.footer,
      });
    } catch (error: any) {
      await tools.cmd.handleError(ctx, error);
    }
  },
};

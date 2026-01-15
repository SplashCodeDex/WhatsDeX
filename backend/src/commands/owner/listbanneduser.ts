import { MessageContext, GlobalContext } from '../../types/index.js';

interface BannedUser {
  banned?: boolean;
}

export default {
  name: 'listbanneduser',
  aliases: ['listban', 'listbanned'],
  category: 'owner',
  permissions: {
    owner: true,
  },
  code: async (ctx: MessageContext) => {
    const { formatter, tools, config, database: db } = ctx.bot.context as GlobalContext;
    try {
      const users = await db.get<Record<string, BannedUser>>('user') || {};
      const bannedUsers: string[] = [];

      for (const userId in users) {
        if (users[userId].banned === true) bannedUsers.push(userId);
      }

      let resultText = '';
      const userMentions: string[] = [];

      bannedUsers.forEach(userId => {
        resultText += `${formatter.quote(`@${userId}`)}
`;
        userMentions.push(`${userId}@s.whatsapp.net`);
      });

      await ctx.reply({
        text: resultText.trim() || config.msg.notFound,
        mentions: userMentions,
        footer: config.msg.footer,
      });
    } catch (error: unknown) {
      await tools.cmd.handleError(ctx, error);
    }
  },
};

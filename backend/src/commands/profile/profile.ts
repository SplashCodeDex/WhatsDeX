import { MessageContext, BotMember } from '../../types/index.js';

export default {
    name: 'profile',
    aliases: ['p', 'me'],
    category: 'profile',
    description: 'View your user profile and statistics.',
    code: async (ctx: MessageContext): Promise<void> => {
        const { databaseService, formatter, logger } = ctx.bot.context;

        if (!databaseService || !formatter) {
            await ctx.reply('❌ System Error: Service unavailable.');
            return;
        }

        try {
            const senderId = ctx.sender.jid;
            const tenantId = ctx.bot.tenantId;

            // Fetch User Data from Firestore
            const user = await databaseService.getUser(tenantId, senderId);

            // Rank calculation (Fetching top 100 in tenant)
            const topUsers = await databaseService.getLeaderboard(tenantId, 100);
            const rank = topUsers.findIndex((u: BotMember) => u.id === senderId) + 1;

            const profileInfo = [
                `👤 *USER PROFILE*`,
                ``,
                `• *Name:* ${ctx.pushName || 'Unknown'}`,
                `• *User ID:* @${senderId.split('@')[0]}`,
                `• *Username:* ${user?.username || 'Not set'}`,
                `• *Status:* ${user?.premium ? '⭐ Premium' : 'Free User'}`,
                ``,
                `💰 *ACCOUNT STATS*`,
                `• *Coins:* ${user?.coin || 0}`,
                `• *Level:* ${user?.level || 0}`,
                `• *Wins:* ${user?.winGame || 0}`,
                `• *Rank:* ${rank > 0 ? `#${rank}` : 'Unranked'}`,
                ``,
                `📅 *TIMESTAMPS*`,
                `• *Join Date:* ${user?.createdAt ? new Date((user.createdAt as any).toDate?.() || user.createdAt).toLocaleDateString() : 'Just joined'}`
            ].join('\n');

            await ctx.reply({
                text: formatter.quote(profileInfo),
                mentions: [senderId]
            });

        } catch (error: unknown) {
            const err = error instanceof Error ? error.message : String(error);
            logger.error(`[${ctx.bot.tenantId}] [Profile] Error: ${err}`, error);
            await ctx.reply(formatter.quote(`Error: ${err}`));
        }
    },
};
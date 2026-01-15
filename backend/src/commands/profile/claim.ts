import { MessageContext, BotMember } from '../../types/index.js';
import { Timestamp } from 'firebase-admin/firestore';

const REWARDS = {
  daily: 100,
  weekly: 1000,
  monthly: 5000,
} as const;

const COOLDOWNS = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
} as const;

export default {
  name: 'claim',
  category: 'profile',
  code: async (ctx: MessageContext): Promise<void> => {
    const { databaseService, formatter, logger } = ctx.bot.context;

    if (!databaseService || !formatter) {
      await ctx.reply('❌ System Error: Service unavailable.');
      return;
    }

    try {
      const tenantId = ctx.bot.tenantId;
      const senderId = ctx.sender.jid;
      const type = (ctx.args[0] || 'daily').toLowerCase();

      if (!Object.keys(REWARDS).includes(type)) {
        await ctx.reply(formatter.quote('ℹ️ Jenis claim tersedia: daily, weekly, monthly.'));
        return;
      }

      // 1. Fetch User
      const user = await databaseService.getUser(tenantId, senderId);
      const now = Date.now();

      const lastClaims = user?.lastClaim || {};
      const typeKey = type as keyof typeof REWARDS;
      const lastClaimTime = lastClaims[typeKey] || 0;

      // 2. Check Cooldown
      if (now - lastClaimTime < COOLDOWNS[typeKey]) {
        const remaining = COOLDOWNS[typeKey] - (now - lastClaimTime);
        const hours = Math.floor(remaining / (60 * 60 * 1000));
        const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
        await ctx.reply(formatter.quote(`⏳ Kamu sudah mengambil reward ${type}.\nTunggu ${hours}j ${minutes}m lagi.`));
        return;
      }

      // 3. Update User
      const rewardKey = type as keyof typeof REWARDS;
      const reward = REWARDS[rewardKey];
      const newCoins = (user?.coin || 0) + reward;
      const updatedClaims = { ...lastClaims, [type]: now };

      const result = await databaseService.updateUser(tenantId, senderId, {
        coin: newCoins,
        lastClaim: updatedClaims
      });

      if (result.success) {
        await ctx.reply(formatter.quote(`✨ Selamat! Kamu mendapatkan ${reward} koin dari claim ${type}.`));
      } else {
        throw result.error;
      }

    } catch (error: unknown) {
      const err = error instanceof Error ? error.message : String(error);
      logger.error(`[${ctx.bot.tenantId}] [Claim] Error: ${err}`, error);
      await ctx.reply(formatter.quote(`Error: ${err}`));
    }
  },
};

const z = require('zod');
const { convertMsToDuration } = require('../../utils/formatters');
const { db } = require('../../src/utils');

// List of available claim rewards
const claimRewards = {
  daily: {
    reward: 100,
    cooldown: 24 * 60 * 60 * 1000, // 24 hours (100 coins)
    level: 1,
    description: 'Daily reward',
  },
  weekly: {
    reward: 500,
    cooldown: 7 * 24 * 60 * 60 * 1000, // 7 days (500 coins)
    level: 15,
    description: 'Weekly reward',
  },
  monthly: {
    reward: 2000,
    cooldown: 30 * 24 * 60 * 60 * 1000, // 30 days (2000 coins)
    level: 50,
    description: 'Monthly reward',
  },
  yearly: {
    reward: 10000,
    cooldown: 365 * 24 * 60 * 60 * 1000, // 365 days (10000 coins)
    level: 75,
    description: 'Yearly reward',
  },
};

const claimTypes = Object.keys(claimRewards);

module.exports = {
  name: 'claim',
  aliases: ['bonus', 'klaim'],
  category: 'profile',
  code: async ctx => {
    const { formatter, config } = ctx.bot.context;

    try {
      const input = (ctx.args.join(' ') || '').toLowerCase();

      if (input === 'list') {
        const listText = claimTypes
          .map(type => formatter.quote(`${type} (${claimRewards[type].description})`))
          .join('\n');
        return ctx.reply({ text: listText, footer: config.msg.footer });
      }

      // Validation
      const claimSchema = z.enum(claimTypes, {
        errorMap: () => ({
          message: 'Invalid claim type. Use ".claim list" to see available claims.',
        }),
      });
      const claimCheck = claimSchema.safeParse(input);

      if (!claimCheck.success) {
        return ctx.reply(formatter.quote(`❎ ${claimCheck.error.issues[0].message}`));
      }
      const claimType = claimCheck.data;
      const claim = claimRewards[claimType];

      // Business Logic
      const senderId = ctx.getId(ctx.sender.jid);
      const userDb = (await db.get(`user.${senderId}`)) || {};
      const level = userDb?.level || 0;

      if (ctx.isOwner || userDb?.premium)
        return ctx.reply(formatter.quote('❎ You have unlimited coins and cannot claim rewards.'));
      if (level < claim.level)
        return ctx.reply(
          formatter.quote(
            `❎ You need to be level ${claim.level} to claim this. Your current level is ${level}.`
          )
        );

      const currentTime = Date.now();
      const lastClaim = (userDb?.lastClaim ?? {})[claimType] || 0;
      const timePassed = currentTime - lastClaim;
      const remainingTime = claim.cooldown - timePassed;

      if (remainingTime > 0)
        return ctx.reply(
          formatter.quote(
            `⏳ You have already claimed the ${claimType} reward. Please wait ${convertMsToDuration(remainingTime)}.`
          )
        );

      const rewardCoin = (userDb?.coin || 0) + claim.reward;
      await db.set(`user.${senderId}.coin`, rewardCoin);
      await db.set(`user.${senderId}.lastClaim.${claimType}`, currentTime);

      return ctx.reply(
        formatter.quote(
          `✅ You successfully claimed the ${claimType} reward of ${claim.reward} coins! Your current balance is ${rewardCoin}.`
        )
      );
    } catch (error) {
      console.error(error);
      return ctx.reply(formatter.quote(`An error occurred: ${error.message}`));
    }
  },
};

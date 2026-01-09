import { MessageContext } from '../../types/index.js';
import { exec } from 'node:child_process';
import process from 'node:process';
import util from 'node:util';

export default {
  name: 'restart',
  aliases: ['r'],
  category: 'owner',
  permissions: {
    owner: true,
  },
  code: async (ctx: MessageContext) => {
    const { formatter, tools, config, database: db } = ctx.bot.context;
    if (!process.env.PM2_HOME)
      return await ctx.reply(
        formatter.quote('❎ Bot is not running under PM2! Manual restart required.')
      );

    try {
      const waitMsg = await ctx.reply(config.msg.wait);
      await db.set('bot.restart', {
        jid: ctx.id,
        key: waitMsg.key,
        timestamp: Date.now(),
      });

      await util.promisify(exec)('pm2 restart $(basename $(pwd))'); // Hanya berfungsi saat menggunakan PM2
    } catch (error: any) {
      await tools.cmd.handleError(ctx, error);
    }
  },
};

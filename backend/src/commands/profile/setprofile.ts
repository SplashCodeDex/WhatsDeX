import { MessageContext } from '../../types/index.js';
import { z } from 'zod';

const ArgsSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/).optional(),
});

export default {
  name: 'setprofile',
  aliases: ['setuser', 'editprofile'],
  category: 'profile',
  code: async (ctx: MessageContext): Promise<void> => {
    const { databaseService, formatter, logger } = ctx.bot.context;

    if (!databaseService || !formatter) {
      await ctx.reply('❌ System Error: Service unavailable.');
      return;
    }

    try {
      const senderId = ctx.sender.jid;
      const tenantId = ctx.bot.tenantId;

      if (!ctx.args || ctx.args.length === 0) {
        await ctx.reply(formatter.quote('ℹ️ Gunakan: .setprofile <username>\nContoh: .setprofile Nico_Dex'));
        return;
      }

      // 1. Validate Args
      const validation = ArgsSchema.safeParse({ username: ctx.args[0] });
      if (!validation.success) {
        await ctx.reply(formatter.quote('❌ Username harus 3-20 karakter dan hanya boleh berisi huruf, angka, atau underscore.'));
        return;
      }

      const { username } = validation.data;

      if (username) {
        // 2. Check if username taken in this tenant
        const isTaken = await databaseService.checkUsernameTaken(tenantId, username);
        if (isTaken) {
          await ctx.reply(formatter.quote(`❌ Username "${username}" sudah digunakan oleh orang lain di server ini.`));
          return;
        }

        // 3. Update User
        const result = await databaseService.updateUser(tenantId, senderId, { username });

        if (result.success) {
          await ctx.reply(formatter.quote(`✅ Username berhasil diatur menjadi: ${username}`));
        } else {
          throw result.error;
        }
      }

    } catch (error: unknown) {
      const err = error instanceof Error ? error.message : String(error);
      logger.error(`[${ctx.bot.tenantId}] [SetProfile] Error: ${err}`, error);
      await ctx.reply(formatter.quote(`Error: ${err}`));
    }
  },
};

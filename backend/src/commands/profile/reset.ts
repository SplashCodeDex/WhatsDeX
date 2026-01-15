import { MessageContext } from '../../types/index.js';
import { z } from 'zod';

const ConfirmationSchema = z.string().refine(val => val.toLowerCase() === 'y', {
  message: 'Konfirmasi harus berupa "y"'
});

export default {
  name: 'reset',
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

      if (!ctx.args[0]) {
        await ctx.reply(formatter.quote('⚠️ PERINGATAN! Perintah ini akan menghapus semua data profil kamu (level, koin, wins).\nKetik `.reset y` untuk mengonfirmasi.'));
        return;
      }

      // 1. Validate Confirmation
      const validation = ConfirmationSchema.safeParse(ctx.args[0]);
      if (!validation.success) {
        await ctx.reply(formatter.quote('ℹ️ Reset dibatalkan. Konfirmasi tidak valid.'));
        return;
      }

      // 2. Delete User Data in Firestore (Tenant-scoped)
      const result = await databaseService.deleteUser(tenantId, senderId);

      if (result.success) {
        await ctx.reply(formatter.quote('✅ Profil kamu telah berhasil direset. Data kamu sekarang bersih.'));
      } else {
        throw result.error;
      }

    } catch (error: unknown) {
      const err = error instanceof Error ? error.message : String(error);
      logger.error(`[${ctx.bot.tenantId}] [Reset] Error: ${err}`, error);
      await ctx.reply(formatter.quote(`Error: ${err}`));
    }
  },
};

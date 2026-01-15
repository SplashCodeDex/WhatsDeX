import { MessageContext } from '../../types/index.js';
import { z } from 'zod';

const AmountSchema = z.number().int().positive();

export default {
  name: 'transfer',
  aliases: ['tf', 'kasih'],
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

      // 1. Resolve Target
      let targetId = '';
      if (ctx.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
        targetId = ctx.message.extendedTextMessage.contextInfo.mentionedJid[0];
      } else if (ctx.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        targetId = ctx.message.extendedTextMessage.contextInfo.participant || '';
      }

      if (!targetId || targetId === senderId) {
        await ctx.reply(formatter.quote('ℹ️ Tag atau balas pesan orang yang ingin kamu beri koin.'));
        return;
      }

      // 2. Resolve Amount
      const amountRaw = parseInt(ctx.args[0] || '0');
      const validation = AmountSchema.safeParse(amountRaw);

      if (!validation.success) {
        await ctx.reply(formatter.quote('❌ Jumlah koin harus berupa angka positif.'));
        return;
      }

      const amount = validation.data;

      // 3. Perform Transfer
      const result = await databaseService.transferCoins(tenantId, senderId, targetId, amount);

      if (result.success) {
        await ctx.reply({
          text: formatter.quote(`✅ Berhasil mentransfer ${amount} koin ke @${targetId.split('@')[0]}`),
          mentions: [targetId]
        });
      } else {
        await ctx.reply(formatter.quote(`❌ Gagal transfer: ${result.error?.message || 'Unknown error'}`));
      }

    } catch (error: unknown) {
      const err = error instanceof Error ? error.message : String(error);
      logger.error(`[${ctx.bot.tenantId}] [Transfer] Error: ${err}`, error);
      await ctx.reply(formatter.quote(`Error: ${err}`));
    }
  },
};

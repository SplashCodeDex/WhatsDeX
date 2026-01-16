import { MessageContext, GlobalContext } from '../../types/index.js';
import { URL } from 'node:url';

export default {
  name: 'join',
  aliases: ['j'],
  category: 'owner',
  permissions: {
    owner: true,
    restrict: true,
  },
  code: async (ctx: MessageContext) => {
    const { formatter, tools, config, tenantConfigService } = ctx.bot.context as GlobalContext;
    const tenantId = (ctx.bot as any).tenantId;

    const url = ctx.args[0] || null;

    if (!url) {
      const instruction = tools.msg.generateInstruction(['send'], ['text']);
      const groupLink = config.bot.groupLink || 'https://chat.whatsapp.com/CodeDeX';
      const example = tools.msg.generateCmdExample(ctx.used, groupLink);
      return await ctx.reply(`${formatter.quote(instruction)}
${formatter.quote(example)}`);
    }

    const isUrl = tools.cmd.isUrl(url);
    if (!isUrl) return await ctx.reply(config.msg.urlInvalid || 'Invalid URL');

    try {
      const tenantResult = await tenantConfigService.getTenantSettings(tenantId);
      const ownerName = tenantResult.success ? tenantResult.data.ownerName || 'Unknown' : 'Unknown';

      const urlCode = new URL(url).pathname.split('/').pop();
      if (!urlCode) throw new Error('Invalid invite link');

      // Access groupAcceptInvite from the underlying WASocket if possible, or use a helper
      // Assuming ctx.bot has direct access or we need to cast
      const res = await (ctx.bot as any).groupAcceptInvite(urlCode);

      if (res) {
        await ctx.sendMessage(res, {
          text: formatter.quote(
            `👋 Halo! Saya adalah bot WhatsApp bernama ${config.bot.name}, dimiliki oleh ${ownerName}. Saya bisa melakukan banyak perintah, seperti membuat stiker, menggunakan AI untuk pekerjaan tertentu, dan beberapa perintah berguna lainnya. Saya di sini untuk menghibur dan menyenangkan kamu!`
          ),
        });
      }

      await ctx.reply(formatter.quote('✅ Berhasil bergabung dengan grup!'));
    } catch (error: unknown) {
      await tools.cmd.handleError(ctx, error);
    }
  },
};

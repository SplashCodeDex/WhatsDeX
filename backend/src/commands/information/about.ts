import { MessageContext } from '../../types/index.js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const packageJson = JSON.parse(readFileSync(join(__dirname, '../../../package.json'), 'utf8'));

export default {
  name: 'about',
  aliases: ['bot', 'infobot'],
  category: 'information',
  code: async (ctx: MessageContext) => {
    const { formatter, tools, config, database: db, tenantConfigService } = ctx.bot.context;
    const tenantId = (ctx.bot as any).tenantId;

    try {
      const botDb = (await db.get<{ mode?: string }>('bot')) || {};
      const tenantResult = await tenantConfigService.getTenantSettings(tenantId);
      const ownerName = tenantResult.success ? tenantResult.data.ownerName || 'Unknown' : 'Unknown';

      await ctx.reply({
        text:
          `${formatter.quote(`👋 Hello! I am a WhatsApp bot named ${config.bot.name}, owned by ${ownerName}. I can perform many commands, such as creating stickers, using AI for certain tasks, and several other useful commands. I am here to entertain and please you!`)}
` + // Can be changed as desired
          `${formatter.quote('· · ─ ·✶· ─ · ·')}\n` +
          `${formatter.quote(`Bot Name: ${config.bot.name}`)}\n` +
          `${formatter.quote(`Version: ${packageJson.version}`)}\n` +
          `${formatter.quote(`Owner: ${ownerName}`)}\n` +
          `${formatter.quote(`Mode: ${tools.msg.ucwords(botDb?.mode || 'public')}`)}\n` +
          `${formatter.quote(`Bot Uptime: ${config.bot.uptime}`)}\n` +
          `${formatter.quote(`Database: ${config.bot.dbSize} (Simpl.DB - JSON)`)}\n${formatter.quote(
            'Library: baileys'
          )}`,
        footer: config.msg.footer,
      });
    } catch (error: unknown) {
      await tools.cmd.handleError(ctx, error);
    }
  },
};

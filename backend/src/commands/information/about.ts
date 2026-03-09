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
    description: 'Get information about the bot.',
    code: async (ctx: MessageContext) => {
        const { formatter, tools, config, database: db, tenantConfigService } = ctx.channel.context;
        const tenantId = (ctx.channel as any).tenantId;

        try {
            const botDb = (await db.get<{ mode?: string }>('bot')) || {};
            const tenantResult = await tenantConfigService.getTenantSettings(tenantId);
            const ownerName = tenantResult.success ? tenantResult.data.ownerName || 'Unknown' : 'Unknown';

            await ctx.reply({
                text:
                    `${formatter.quote(`👋 Hello! I am a WhatsApp bot named ${config.channel.name}, owned by ${ownerName}. I can perform many commands, such as creating stickers, using AI for certain tasks, and several other useful commands. I am here to entertain and please you!`)}
` +
                    `${formatter.quote('· · ─ ·✶· ─ · ·')}
` +
                    `${formatter.quote(`Bot Name: ${config.channel.name}`)}
` +
                    `${formatter.quote(`Version: ${packageJson.version}`)}
` +
                    `${formatter.quote(`Owner: ${ownerName}`)}
` +
                    `${formatter.quote(`Mode: ${tools.msg.ucwords(botDb?.mode || 'public')}`)}
` +
                    `${formatter.quote(`Bot Uptime: ${config.channel.uptime}`)}
` +
                    `${formatter.quote(`Database: ${config.channel.dbSize} (Simpl.DB - JSON)`)}
${formatter.quote(
                        'Library: baileys'
                    )}`,
                footer: config.msg.footer,
            });
        } catch (error: unknown) {
            await tools.cmd.handleError(ctx, error);
        }
    },
};

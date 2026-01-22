import { MessageContext } from '../../types/index.js';
import os from 'node:os';
import process from 'node:process';

export default {
    name: 'server',
    category: 'information',
    description: 'Get information about the server running the bot.',
    code: async (ctx: MessageContext) => {
        const { formatter, tools, config } = ctx.bot.context;
        try {
            const memory = process.memoryUsage();
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const usedMem = totalMem - freeMem;
            const uptimeOS = os.uptime() * 1000;
            const load = os.loadavg();
            const cpus = os.cpus();

            await ctx.reply({
                text:
                    `${formatter.quote(`OS: ${os.type()} (${os.platform()})`)}
` +
                    `${formatter.quote(`Arch: ${os.arch()}`)}
` +
                    `${formatter.quote(`Release: ${os.release()}`)}
` +
                    `${formatter.quote(`Hostname: ${os.hostname()}`)}
` +
                    `${formatter.quote(`System Uptime: ${tools.msg.convertMsToDuration(uptimeOS)}`)}
` +
                    `${formatter.quote('· · ─ ·✶· ─ · ·')}
` +
                    `${formatter.quote(`Used: ${tools.msg.formatSize(usedMem)}`)}
` +
                    `${formatter.quote(`Free: ${tools.msg.formatSize(freeMem)}`)}
` +
                    `${formatter.quote(`Total: ${tools.msg.formatSize(totalMem)}`)}
` +
                    `${formatter.quote(`Application Memory (RSS): ${tools.msg.formatSize(memory.rss)}`)}
` +
                    `${formatter.quote('· · ─ ·✶· ─ · ·')}
` +
                    `${formatter.quote(`Model: ${cpus[0].model}`)}
` +
                    `${formatter.quote(`Speed: ${cpus[0].speed} MHz`)}
` +
                    `${formatter.quote(`Cores: ${cpus.length}`)}
` +
                    `${formatter.quote(`Average Load: ${load.map(avg => avg.toFixed(2)).join(', ')}`)}
` +
                    `${formatter.quote('· · ─ ·✶· ─ · ·')}
` +
                    `${formatter.quote(`NodeJS Version: ${process.version}`)}
` +
                    `${formatter.quote(`PID: ${process.pid}`)}
` +
                    `${formatter.quote('· · ─ ·✶· ─ · ·')}
` +
                    `${formatter.quote(`Bot Uptime: ${config.bot.uptime}`)}
` +
                    `${formatter.quote(`Database: ${config.bot.dbSize} (Simpl.DB - JSON)`)}
${formatter.quote(
                        'Library: baileys'
                    )}`,                footer: config.msg.footer,
            });
        } catch (error: any) {
            await tools.cmd.handleError(ctx, error);
        }
    },
};
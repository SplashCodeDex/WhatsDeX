import os from 'node:os';
import process from 'node:process';

export default {
  name: 'server',
  category: 'information',
  code: async ctx => {
    const { formatter, tools, config } = ctx.bot.context;
    try {
      const startTime = config.bot.readyAt;
      const memory = process.memoryUsage();
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const uptimeOS = os.uptime() * 1000;
      const load = os.loadavg();
      const cpus = os.cpus();

      await ctx.reply({
        text:
          `${formatter.quote(`OS: ${os.type()} (${os.platform()})`)}\n` +
          `${formatter.quote(`Arch: ${os.arch()}`)}\n` +
          `${formatter.quote(`Release: ${os.release()}`)}\n` +
          `${formatter.quote(`Hostname: ${os.hostname()}`)}\n` +
          `${formatter.quote(`System Uptime: ${tools.msg.convertMsToDuration(uptimeOS)}`)}\n` +
          `${formatter.quote('· · ─ ·✶· ─ · ·')}\n` +
          `${formatter.quote(`Used: ${tools.msg.formatSize(usedMem)}`)}\n` +
          `${formatter.quote(`Free: ${tools.msg.formatSize(freeMem)}`)}\n` +
          `${formatter.quote(`Total: ${tools.msg.formatSize(totalMem)}`)}\n` +
          `${formatter.quote(`Application Memory (RSS): ${tools.msg.formatSize(memory.rss)}`)}\n` +
          `${formatter.quote('· · ─ ·✶· ─ · ·')}\n` +
          `${formatter.quote(`Model: ${cpus[0].model}`)}\n` +
          `${formatter.quote(`Speed: ${cpus[0].speed} MHz`)}\n` +
          `${formatter.quote(`Cores: ${cpus.length}`)}\n` +
          `${formatter.quote(`Average Load: ${load.map(avg => avg.toFixed(2)).join(', ')}`)}\n` +
          `${formatter.quote('· · ─ ·✶· ─ · ·')}\n` +
          `${formatter.quote(`NodeJS Version: ${process.version}`)}\n` +
          `${formatter.quote(`Platform: ${process.platform}`)}\n` +
          `${formatter.quote(`Exec Path: ${process.execPath}`)}\n` +
          `${formatter.quote(`PID: ${process.pid}`)}\n` +
          `${formatter.quote('· · ─ ·✶· ─ · ·')}\n` +
          `${formatter.quote(`Bot Uptime: ${config.bot.uptime}`)}\n` +
          `${formatter.quote(`Database: ${config.bot.dbSize} (Simpl.DB - JSON)`)}\n${formatter.quote(
            'Library: @whiskeysockets/baileys'
          )}`,
        footer: config.msg.footer,
      });
    } catch (error) {
      await tools.cmd.handleError(ctx, error);
    }
  },
};

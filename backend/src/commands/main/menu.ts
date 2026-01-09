import { MessageContext, GlobalContext } from '../../types/index.js';
import moment from 'moment-timezone';

export default {
  name: 'menu',
  aliases: ['allmenu', 'help', 'list', 'listmenu'],
  category: 'main',
  code: async (ctx: MessageContext) => {
    const { config, formatter, tools, state } = ctx.bot.context as GlobalContext;
    try {
      const { cmd } = ctx.bot;
      const tag: Record<string, string> = {
        'ai-chat': 'AI (Chat)',
        'ai-image': 'AI (Image)',
        'ai-video': 'AI (Video)',
        'ai-misc': 'AI (Miscellaneous)',
        converter: 'Converter',
        downloader: 'Downloader',
        entertainment: 'Entertainment',
        game: 'Game',
        group: 'Group',
        maker: 'Maker',
        profile: 'Profile',
        search: 'Search',
        tool: 'Tool',
        owner: 'Owner',
        information: 'Information',
        misc: 'Miscellaneous',
      };

      let text =
        `Hello, @${ctx.getId(ctx.sender.jid)}! I am a WhatsApp bot named ${config.bot.name}, owned by ${config.owner.name}. I can perform many commands, such as creating stickers, using AI for specific tasks, and other useful commands.\n` +
        '\n' +
        `${formatter.quote(`Date: ${moment.tz(config.system.timeZone).locale('en').format('dddd, DD MMMM YYYY')}`)}\n` +
        `${formatter.quote(`Time: ${moment.tz(config.system.timeZone).format('HH:mm:ss')}`)}\n` +
        '\n' +
        `${formatter.quote(`Uptime: ${state.uptime}`)}\n` +
        `${formatter.quote(`Database: ${state.dbSize} (Simpl.DB - JSON)`)}\n` +
        `${formatter.quote('Library: @whiskeysockets/baileys')}\n` +
        '\n' +
        `${formatter.italic(`Type ${formatter.monospace(`${cmd} <command>`)} to see command details.`)}\n` +
        '\n' +
        Object.keys(tag)
          .map((c) => {
            const commands = ctx.bot.command.filter(
              (cmd) => cmd.category === c && !cmd.hide
            );
            if (commands.length === 0) return '';
            return (
              `*${tag[c]}* _(${commands.length})_\n` +
              commands
                .map((cmd) => formatter.monospace(cmd.name))
                .sort()
                .join(', ')
            );
          })
          .filter(Boolean)
          .join('\n\n');

      await ctx.reply(text);
    } catch (error: any) {
      await ctx.reply(`Error: ${error.message}`);
    }
  },
};

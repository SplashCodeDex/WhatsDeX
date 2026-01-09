import { MessageContext } from '../../types/index.js';
export default {
  name: 'videogpt',
  aliases: ['vidgpt'],
  category: 'ai-video',
  permissions: {
    premium: true,
  },
  code: async (ctx: MessageContext) => {
    const { formatter, tools, config } = ctx.bot.context;
    const input = ctx.args.join(' ') || ctx.quoted?.content || null;

    if (!input)
      return await ctx.reply(
        `${formatter.quote(tools.msg.generateInstruction(['send'], ['text']))}\n` +
          `${formatter.quote(tools.msg.generateCmdExample(ctx.used, 'anime girl with short blue hair'))}\n${formatter.quote(
            tools.msg.generateNotes([
              'Balas atau quote pesan untuk menjadikan teks sebagai input target, jika teks memerlukan baris baru.',
            ])
          )}`
      );

    try {
      const apiUrl = tools.api.createUrl('neko', '/ai-vid/videogpt', {
        text: input,
      });
      const axios = (await import('axios')).default;
      const { result } = (await axios.get(apiUrl)).data;

      await ctx.reply({
        video: {
          url: result,
        },
        mimetype: tools.mime.lookup('mp4'),
        caption: formatter.quote(`Prompt: ${input}`),
        footer: config.msg.footer,
        buttons: [
          {
            buttonId: `${ctx.used.prefix + ctx.used.command} ${input}`,
            buttonText: {
              displayText: 'Ambil Lagi',
            },
          },
        ],
      });
    } catch (error: any) {
      await tools.cmd.handleError(ctx, error, true);
    }
  },
};

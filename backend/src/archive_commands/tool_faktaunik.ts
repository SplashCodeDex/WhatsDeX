import { MessageContext } from '../../types/index.js';
import axios from 'axios';

export default {
  name: 'faktaunik',
  aliases: ['fakta'],
  category: 'tool',
  permissions: {
    coin: 10,
  },
  code: async (ctx: MessageContext) => {
    const { tools, config } = ctx.bot.context;
    try {
      const apiUrl = tools.api.createUrl(
        'https://raw.githubusercontent.com',
        '/HasamiAini/Bot_Takagisan/refs/heads/main/faktanya.txt'
      );
      const result = tools.cmd.getRandomElement(
        (await axios.get(apiUrl)).data.trim().split('\n').filter(Boolean)
      );

      await ctx.reply({
        text: result as string,
        footer: config.msg.footer,
        buttons: [
          {
            buttonId: ctx.used.prefix + ctx.used.command,
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

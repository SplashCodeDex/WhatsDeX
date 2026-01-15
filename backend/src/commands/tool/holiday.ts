import { MessageContext, GlobalContext } from '../../types/index.js';
import axios from 'axios';
import moment from 'moment-timezone';

interface Holiday {
  tanggal: string;
  keterangan: string;
}

export default {
  name: 'holiday',
  aliases: ['harilibur', 'libur'],
  category: 'tool',
  permissions: {
    coin: 10,
  },
  code: async (ctx: MessageContext) => {
    const { formatter, tools, config } = ctx.bot.context as GlobalContext;
    const month = new Date().getMonth() + 1;
    // Assume tools.api.createUrl handles base URL correctly or use direct URL
    const apiUrl = `https://dayoffapi.vercel.app/api?month=${month}`;

    try {
      const { data } = await axios.get<Holiday[]>(apiUrl);
      const result = data;

      const resultText = result
        .reverse()
        .map((res: Holiday) => {
          const formattedDate = moment
            .tz(res.tanggal, 'Asia/Jakarta')
            .locale('id')
            .format('dddd, DD MMMM YYYY');
          return `${formatter.quote(res.keterangan)}
${formatter.quote(formattedDate)}`;
        })
        .join('\n' + `${formatter.quote('· · ─ ·✶· ─ · ·')}\n`);
      await ctx.reply({
        text: resultText || config.msg.notFound || 'No holidays found',
        footer: config.msg.footer,
      });
    } catch (error: unknown) {
      await tools.cmd.handleError(ctx, error, true);
    }
  },
};
import { MessageContext, GlobalContext } from '../../types/index.js';
import axios, { AxiosError } from 'axios';

interface APIConfig {
  baseURL: string;
  apikey?: string;
}

export default {
  name: 'checkapis',
  aliases: ['cekapi', 'checkapi'],
  category: 'owner',
  permissions: {
    owner: true,
  },
  code: async (ctx: MessageContext) => {
    const { formatter, tools, config } = ctx.bot.context as GlobalContext;
    try {
      const APIs: Record<string, APIConfig> = tools.api.listUrl();
      let resultText = '';

      for (const [, api] of Object.entries(APIs)) {
        try {
          const response = await axios.get(api.baseURL, {
            timeout: 5000,
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
            },
          });

          if (response.status >= 200 && response.status < 500) {
            resultText += formatter.quote(`${api.baseURL} 🟢 (${response.status})
`);
          } else {
            resultText += formatter.quote(`${api.baseURL} 🔴 (${response.status})
`);
          }
        } catch (error: unknown) {
          const err = error as AxiosError;
          if (err.response) {
            resultText += formatter.quote(`${api.baseURL} 🔴 (${err.response.status})
`);
          } else if (err.request) {
            resultText += formatter.quote(`${api.baseURL} 🔴 (Tidak ada respon)
`);
          } else {
            resultText += formatter.quote(`${api.baseURL} 🔴 (Kesalahan: ${err.message})
`);
          }
        }
      }

      await ctx.reply({
        text: resultText.trim(),
        footer: config.msg.footer,
      });
    } catch (error: unknown) {
      await tools.cmd.handleError(ctx, error);
    }
  },
};
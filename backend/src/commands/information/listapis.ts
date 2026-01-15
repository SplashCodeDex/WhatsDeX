import { MessageContext, GlobalContext } from '../../types/index.js';

interface APIConfig {
  baseURL: string;
}

export default {
  name: 'listapis',
  aliases: ['listapi'],
  category: 'information',
  code: async (ctx: MessageContext) => {
    const { formatter, tools, config } = ctx.bot.context as GlobalContext;
    try {
      const APIs: Record<string, APIConfig> = tools.api.listUrl();
      let resultText = '';

      for (const [, api] of Object.entries(APIs)) {
        resultText += formatter.quote(`${api.baseURL}\n`);
      }

      await ctx.reply({
        text: `${formatter.quote('List of APIs used:')}\n${resultText.trim()}`,
        footer: config.msg.footer,
      });
    } catch (error: unknown) {
      await tools.cmd.handleError(ctx, error);
    }
  },
};
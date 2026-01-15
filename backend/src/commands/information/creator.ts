import { MessageContext, GlobalContext } from '../../types/index.js';
import VCardModule from 'vcard-creator';

export default {
  name: 'owner',
  aliases: ['creator', 'developer'],
  category: 'information',
  code: async (ctx: MessageContext) => {
    const { tools, config } = ctx.bot.context as GlobalContext;
    try {
      // Handle potential ESM/CJS interop issues with vcard-creator
      const VCard = (VCardModule as any).default || VCardModule;
      const vcard = new VCard()
        .addName(config.owner.name)
        .addPhoneNumber(config.owner.number)
        .toString();

      await ctx.reply({
        contacts: {
          displayName: config.owner.name,
          contacts: [
            {
              vcard,
            },
          ],
        },
      });
    } catch (error: unknown) {
      await tools.cmd.handleError(ctx, error);
    }
  },
};
import { MessageContext } from '../../types/index.js';
import VCard from 'vcard-creator';


export default {
  name: 'owner',
  aliases: ['creator', 'developer'],
  category: 'information',
  code: async (ctx: MessageContext) => {
    const { tools, config } = ctx.bot.context;
    try {
      const vcard = new VCard()
        .addName(config.owner.name)
        .addCompany(config.owner.organization)
        .addPhoneNumber(config.owner.id)
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
    } catch (error: any) {
      await tools.cmd.handleError(config, ctx, error);
    }
  },
};

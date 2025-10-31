const VCard = require('vcard-creator').default;

module.exports = {
  name: 'owner',
  aliases: ['creator', 'developer'],
  category: 'information',
  code: async ctx => {
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
    } catch (error) {
      await tools.cmd.handleError(config, ctx, error);
    }
  },
};

import { MessageContext, GlobalContext } from '../../types/index.js';
import VCardModule from 'vcard-creator';

export default {
    name: 'owner',
    aliases: ['creator', 'developer'],
    category: 'information',
    description: 'Get the contact details of the bot owner.',
    code: async (ctx: MessageContext) => {
        const { tools, config, tenantConfigService } = ctx.bot.context as GlobalContext;
        const tenantId = (ctx.bot as any).tenantId;

        try {
            // Get tenant settings
            const tenantResult = await tenantConfigService.getTenantSettings(tenantId);
            const ownerName = tenantResult.success ? tenantResult.data.ownerName || 'Unknown' : 'Unknown';
            const ownerNumber = tenantResult.success ? tenantResult.data.ownerNumber : '0000000000';

            // Handle potential ESM/CJS interop issues with vcard-creator
            const VCard = (VCardModule as any).default || VCardModule;
            const vcard = new VCard()
                .addName(ownerName)
                .addPhoneNumber(ownerNumber)
                .toString();

            await ctx.reply({
                contacts: {
                    displayName: ownerName,
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
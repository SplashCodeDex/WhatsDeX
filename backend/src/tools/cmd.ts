
/**
 * Command utilities
 */

type FlagOptions = {
    [key: string]: {
        type: 'boolean' | 'value';
        key: string;
        validator?: (val: any) => boolean;
        parser?: (val: any) => any;
    };
};

/**
 * Parses flags from arguments
 * @param args - The argument string
 * @param options - Flag configuration definition
 */
export const parseFlag = (args: string, options: FlagOptions) => {
    const result: any = { input: args };
    const argsArray = args.split(' ');

    const keysToRemove: number[] = [];

    for (const [flag, config] of Object.entries(options)) {
        const index = argsArray.indexOf(flag);
        if (index !== -1) {
            if (config.type === 'boolean') {
                result[config.key] = true;
                keysToRemove.push(index);
            } else if (config.type === 'value') {
                const value = argsArray[index + 1];
                if (value) {
                    if (config.validator && !config.validator(value)) {
                        continue;
                    }
                    result[config.key] = config.parser ? config.parser(value) : value;
                    keysToRemove.push(index); // flag
                    keysToRemove.push(index + 1); // value
                }
            }
        }
    }

    // Sort descending to remove back-to-front
    keysToRemove.sort((a, b) => b - a);
    for (const idx of keysToRemove) {
        argsArray.splice(idx, 1);
    }

    result.input = argsArray.join(' ').trim();
    return result;
};

export const handleError = async (ctx: any, error: any) => {
    const { formatter } = ctx.bot.context;
    console.error(error);
    await ctx.reply(formatter.quote(`An error occurred: ${error.message}`));
};

export const fakeMetaAiQuotedText = (text: string) => {
    return {
        key: {
            remoteJid: 'status@broadcast',
            fromMe: false,
            id: 'META_AI_MOCK',
        },
        message: {
            conversation: text,
        },
        pushName: 'Meta AI',
    };
};

export const isUrl = (url: string) => {
    return url.match(
        new RegExp(
            /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/,
            'gi'
        )
    );
};

export const checkQuotedMedia = (type: string | undefined, expectedTypes: string[]) => {
    if (!type) return false;
    return expectedTypes.some(t => type.toLowerCase().includes(t.toLowerCase()));
};

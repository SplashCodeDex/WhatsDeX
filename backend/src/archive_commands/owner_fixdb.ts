import { MessageContext, GlobalContext } from '../../types/index.js';

interface SchemaDefinition {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  default: any;
  min?: number;
  max?: number;
  properties?: Record<string, SchemaDefinition>;
}

interface DatabaseSchemas {
  user: Record<string, SchemaDefinition>;
  group: Record<string, SchemaDefinition>;
  menfess: Record<string, SchemaDefinition>;
  [key: string]: Record<string, SchemaDefinition>;
}

export default {
  name: 'fixdb',
  aliases: ['fixdatabase'],
  category: 'owner',
  permissions: {
    owner: true,
  },
  code: async (ctx: MessageContext) => {
    const { formatter, tools, config, database: db } = ctx.bot.context as GlobalContext;
    const input = ctx.args[0] || null;

    if (!input) {
      const instruction = tools.msg.generateInstruction(['send'], ['text']);
      const example = tools.msg.generateCmdExample(ctx.used, 'user');
      return await ctx.reply(`${formatter.quote(instruction)}
${formatter.quote(example)}`);
    }

    if (input.toLowerCase() === 'list') {
      const listText = await tools.list.get('fixdb');
      await ctx.reply({
        text: listText,
        footer: config.msg.footer,
      });
      return;
    }

    try {
      const waitMsg = await ctx.reply(config.msg.wait);
      const data: Record<string, any> = {
        user: (await db.get('user')) || {},
        group: (await db.get('group')) || {},
        menfess: (await db.get('menfess')) || {},
      };

      const mappings: DatabaseSchemas = {
        user: {
          afk: {
            type: 'object',
            default: { reason: '', timestamp: 0 },
            properties: {
              reason: { type: 'string', default: '' },
              timestamp: { type: 'number', default: 0 }
            }
          },
          autolevelup: { type: 'boolean', default: false },
          banned: { type: 'boolean', default: false },
          coin: { type: 'number', default: 0, min: 0 },
          lastClaim: {
            type: 'object',
            default: { daily: 0, weekly: 0, monthly: 0, yearly: 0 },
            properties: {
              daily: { type: 'number', default: 0 },
              weekly: { type: 'number', default: 0 },
              monthly: { type: 'number', default: 0 },
              yearly: { type: 'number', default: 0 }
            }
          },
          level: { type: 'number', default: 0, min: 0 },
          premium: { type: 'boolean', default: false },
          username: { type: 'string', default: '' },
          winGame: { type: 'number', default: 0, min: 0 },
          xp: { type: 'number', default: 0, min: 0 },
        },
        group: {
          maxwarnings: { type: 'number', default: 3, min: 1 },
          mute: { type: 'array', default: [] },
          mutebot: { type: 'boolean', default: false },
          option: {
            type: 'object',
            default: {},
            properties: {
              antiaudio: { type: 'boolean', default: false },
              antidocument: { type: 'boolean', default: false },
              antigif: { type: 'boolean', default: false },
              antiimage: { type: 'boolean', default: false },
              antilink: { type: 'boolean', default: false },
              antisticker: { type: 'boolean', default: false },
              welcome: { type: 'boolean', default: false },
            }
          },
          sewa: { type: 'boolean', default: false },
          sewaExpiration: { type: 'number', default: 0 },
          spam: { type: 'array', default: [] },
          warnings: { type: 'array', default: [] },
        },
        menfess: {
          from: { type: 'string', default: '' },
          to: { type: 'string', default: '' },
        },
      };

      const validateAndFixValue = (value: any, schema: SchemaDefinition): any => {
        if (value === undefined || value === null) return schema.default;

        if (schema.type === 'array') return Array.isArray(value) ? value : schema.default;

        if (schema.type === 'object' && schema.properties) {
          if (typeof value !== 'object' || Array.isArray(value)) return schema.default;
          const result: Record<string, any> = {};
          for (const key in schema.properties) {
            result[key] = validateAndFixValue(value[key], schema.properties[key]);
          }
          return result;
        }

        if (typeof value !== schema.type) return schema.default;

        if (schema.type === 'number') {
          if (schema.min !== undefined && value < schema.min) return schema.default;
          if (schema.max !== undefined && value > schema.max) return schema.default;
        }

        return value;
      };

      const processData = async (category: string, categoryData: Record<string, any>) => {
        if (ctx.editMessage && waitMsg?.key) {
          await ctx.editMessage(waitMsg.key, formatter.quote(`🔄 Memproses data ${category}...`));
        }

        const schema = mappings[category];
        const validIds: string[] = [];

        for (const id in categoryData) {
          const item = categoryData[id] || {};
          const fixedItem: Record<string, any> = {};

          for (const field in schema) {
            fixedItem[field] = validateAndFixValue(item[field], schema[field]);
          }

          await db.set(`${category}.${id}`, fixedItem);
          validIds.push(id);
        }

        return validIds.length;
      };

      if (!mappings[input]) {
        if (ctx.editMessage && waitMsg?.key) {
          return await ctx.editMessage(waitMsg.key, formatter.quote(`❎ Invalid data type: ${input}`));
        }
        return await ctx.reply(formatter.quote(`❎ Invalid data type: ${input}`));
      }

      const processedCount = await processData(input, data[input]);

      if (ctx.editMessage && waitMsg?.key) {
        await ctx.editMessage(
          waitMsg.key,
          formatter.quote(`✅ Berhasil membersihkan ${processedCount} data untuk ${input}!`)
        );
      } else {
        await ctx.reply(formatter.quote(`✅ Berhasil membersihkan ${processedCount} data untuk ${input}!`));
      }

    } catch (error: unknown) {
      await tools.cmd.handleError(ctx, error);
    }
  },
};

import axios from 'axios';

export default {
  name: 'alkitab',
  aliases: ['bible'],
  category: 'tool',
  permissions: {
    coin: 10,
  },
  code: async ctx => {
    const { formatter, tools, config } = ctx.bot.context;
    const [passage, number] = ctx.args;

    if (!passage && !number)
      return await ctx.reply(
        `${formatter.quote(tools.msg.generateInstruction(['send'], ['text']))}\n` +
          `${formatter.quote(tools.msg.generateCmdExample(ctx.used, 'kej 2:18'))}\n${formatter.quote(
            tools.msg.generateNotes([
              `Type ${formatter.inlineCode(`${ctx.used.prefix + ctx.used.command} list`)} to see the list.`,
            ])
          )}`
      );

    if (passage.toLowerCase() === 'list') {
      const listText = await tools.list.get('alkitab');
      return await ctx.reply({
        text: listText,
        footer: config.msg.footer,
      });
    }

    try {
      const apiUrl = tools.api.createUrl('https://api-alkitab.vercel.app', `/api/passage`, {
        passage,
        num: number,
      });
      const result = (await axios.get(apiUrl)).data.bible.book;

      const resultText = result.chapter.verses
        .map(
          vers => `${formatter.quote(`Verse: ${vers.number}`)}\n${formatter.quote(`${vers.text}`)}`
        )
        .join('\n' + `${formatter.quote('· · ─ ·✶· ─ · ·')}\n`);
      await ctx.reply({
        text:
          `${formatter.quote(`Name: ${result.name}`)}\n` +
          `${formatter.quote(`Chapter: ${result.chapter.chap}`)}\n` +
          `${formatter.quote('· · ─ ·✶· ─ · ·')}\n${resultText}`,
        footer: config.msg.footer,
      });
    } catch (error) {
      await tools.cmd.handleError(ctx, error, true);
    }
  },
};

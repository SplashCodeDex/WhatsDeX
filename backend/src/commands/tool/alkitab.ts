import { MessageContext, GlobalContext } from '../../types/index.js';
import axios from 'axios';

interface Verse {
  number: number;
  text: string;
}

interface BibleBook {
  name: string;
  chapter: {
    chap: number;
    verses: Verse[];
  };
}

export default {
  name: 'alkitab',
  aliases: ['bible'],
  category: 'tool',
  permissions: {
    coin: 10,
  },
  code: async (ctx: MessageContext) => {
    const { formatter, tools, config } = ctx.bot.context as GlobalContext;
    const [passage, number] = ctx.args;

    if (!passage && !number) {
        // Safe fallback if tools.msg is complex
      const instruction = tools.msg.generateInstruction(['send'], ['text']);
      const example = tools.msg.generateCmdExample(ctx.used, 'kej 2:18');
      return await ctx.reply(`${formatter.quote(instruction)}
${formatter.quote(example)}`);
    }

    if (passage.toLowerCase() === 'list') {
      const listText = await tools.list.get('alkitab');
      return await ctx.reply({
        text: listText,
        footer: config.msg.footer,
      });
    }

    try {
      // Mocking createUrl or using directly if available in tools
      const apiUrl = `https://api-alkitab.vercel.app/api/passage?passage=${passage}&num=${number || ''}`;
      const { data } = await axios.get<{ bible: { book: BibleBook } }>(apiUrl);
      const result = data.bible.book;

      const resultText = result.chapter.verses
        .map(
          (vers: Verse) => `${formatter.quote(`Verse: ${vers.number}`)}
${formatter.quote(`${vers.text}`)}`
        )
        .join('\n' + `${formatter.quote('· · ─ ·✶· ─ · ·')}\n`);
      await ctx.reply({
        text:
          `${formatter.quote(`Name: ${result.name}`)}
` + 
          `${formatter.quote(`Chapter: ${result.chapter.chap}`)}
` + 
          `${formatter.quote('· · ─ ·✶· ─ · ·')}\n${resultText}`,
        footer: config.msg.footer,
      });
    } catch (error: unknown) {
      await tools.cmd.handleError(ctx, error, true);
    }
  },
};
import { MessageContext, GlobalContext } from '../../types/index.js';
import axios from 'axios';

interface QuranVerse {
  number: number;
  text: string;
  transliteration: string;
  translation_id: string;
}

interface QuranSurah {
  name: string;
  translate: string;
  verses: QuranVerse[];
}

export default {
  name: 'alquran',
  aliases: ['quran'],
  category: 'tool',
  code: async (ctx: MessageContext) => {
    const { formatter, tools, config } = ctx.bot.context as GlobalContext;
    const [suratStr, ayatStr] = ctx.args;

    if (!suratStr && !ayatStr) {
      const instruction = tools.msg.generateInstruction(['send'], ['text']);
      const example = tools.msg.generateCmdExample(ctx.used, '21 35');
      return await ctx.reply(`${formatter.quote(instruction)}
${formatter.quote(example)}`);
    }

    if (suratStr.toLowerCase() === 'list') {
      const listText = await tools.list.get('alquran');
      return await ctx.reply({
        text: listText,
        footer: config.msg.footer,
      });
    }

    const surat = parseInt(suratStr);
    if (isNaN(surat) || surat < 1 || surat > 114)
      return await ctx.reply(formatter.quote('❎ Surah must be a number between 1 and 114!'));

    try {
      const apiUrl = `https://api.neko.fun/religious/nuquran-surah?id=${surat}`;
      const { data } = await axios.get<{ result: QuranSurah }>(apiUrl);
      const result = data.result;
      const { verses } = result;

      if (ayatStr) {
        if (ayatStr.includes('-')) {
          const [startAyat, endAyat] = ayatStr.split('-').map(Number);
          const selectedVerses = verses.filter(
            (vers: QuranVerse) => vers.number >= startAyat && vers.number <= endAyat
          );

          if (isNaN(startAyat) || isNaN(endAyat) || startAyat < 1 || endAyat < startAyat)
            return await ctx.reply(formatter.quote('❎ Verse range is not valid!'));
          if (!selectedVerses.length)
            return await ctx.reply(
              formatter.quote(`❎ Verses in range ${startAyat}-${endAyat} do not exist!`)
            );

          const versesText = selectedVerses
            .map(
              (vers: QuranVerse) =>
                `${formatter.quote(`Verse ${vers.number}:`)}
` +
                `${vers.text} (${vers.transliteration})
${formatter.italic(vers.translation_id)}`
            )
            .join('\n');
          await ctx.reply({
            text:
              `${formatter.quote(`Surah: ${result.name}`)}
` +
              `${formatter.quote(`Meaning: ${result.translate}`)}
` +
              `${formatter.quote('· · ─ ·✶· ─ · ·')}
${versesText}`,
            footer: config.msg.footer,
          });
        } else {
          const singleAyat = parseInt(ayatStr);
          const verse = verses.find((vers: QuranVerse) => vers.number === singleAyat);

          if (isNaN(singleAyat) || singleAyat < 1)
            return await ctx.reply(
              formatter.quote('❎ Verse must be a valid number greater than 0!')
            );
          if (!verse)
            return await ctx.reply(formatter.quote(`❎ Verse ${singleAyat} does not exist!`));

          await ctx.reply({
            text:
              `${formatter.quote(`Surah: ${result.name}`)}
` +
              `${formatter.quote(`Meaning: ${result.translate}`)}
` +
              `${formatter.quote('· · ─ ·✶· ─ · ·')}
` +
              `${verse.text} (${verse.transliteration})
${formatter.italic(verse.translation_id)}`,
            footer: config.msg.footer,
          });
        }
      } else {
        const versesText = verses
          .map(
            (vers: QuranVerse) =>
              `${formatter.quote(`Verse ${vers.number}:`)}
` +
              `${vers.text} (${vers.transliteration})
${formatter.italic(vers.translation_id)}`
          )
          .join('\n');
        await ctx.reply({
          text:
            `${formatter.quote(`Surah: ${result.name}`)}
` +
            `${formatter.quote(`Meaning: ${result.translate}`)}
` +
            `${formatter.quote('· · ─ ·✶· ─ · ·')}
${versesText}`,
          footer: config.msg.footer,
        });
      }
    } catch (error: unknown) {
      await tools.cmd.handleError(ctx, error, true);
    }
  },
};
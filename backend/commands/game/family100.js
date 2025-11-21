import axios from 'axios';
import didYouMean from 'didyoumean';

const session = new Map();

export default {
  name: 'family100',
  category: 'game',
  permissions: {
    group: true,
  },
  code: async ctx => {
    const { formatter, tools, config, database: db } = ctx.bot.context;
    if (session.has(ctx.id))
      return await ctx.reply(formatter.quote('🎮 A game session is already in progress!'));

    try {
      const apiUrl = tools.api.createUrl(
        'https://raw.githubusercontent.com',
        '/BochilTeam/database/refs/heads/master/games/family100.json'
      );
      const result = tools.cmd.getRandomElement((await axios.get(apiUrl)).data);

      const game = {
        coin: {
          answered: 10,
          allAnswered: 100,
        },
        timeout: 90000,
        answers: new Set(result.jawaban.map(ans => ans.toLowerCase())),
        participants: new Set(),
      };

      session.set(ctx.id, true);

      await ctx.reply({
        text:
          `${formatter.quote(`Question: ${result.soal}`)}
` +
          `${formatter.quote(`Number of answers: ${game.answers.size}`)}
${formatter.quote(`Time limit: ${tools.msg.convertMsToDuration(game.timeout)}`)}`,
        footer: config.msg.footer,
        buttons: [
          {
            buttonId: 'surrender',
            buttonText: {
              displayText: 'Surrender',
            },
          },
        ],
      });

      const collector = ctx.MessageCollector({
        time: game.timeout,
      });

      const playAgain = [
        {
          buttonId: ctx.used.prefix + ctx.used.command,
          buttonText: {
            displayText: 'Play Again',
          },
        },
      ];

      collector.on('collect', async m => {
        const participantAnswer = m.content.toLowerCase();
        const participantId = ctx.getId(m.sender);

        if (game.answers.has(participantAnswer)) {
          game.answers.delete(participantAnswer);
          game.participants.add(participantId);

          await db.add(`user.${participantId}.coin`, game.coin.answered);
          await ctx.sendMessage(
            ctx.id,
            {
              text: formatter.quote(
                `✅ ${tools.msg.ucwords(participantAnswer)} is correct! Remaining answers: ${game.answers.size}`
              ),
            },
            {
              quoted: m,
            }
          );

          if (game.answers.size === 0) {
            session.delete(ctx.id);
            collector.stop();
            for (const participant of game.participants) {
              await db.add(`user.${participant}.coin`, game.coin.allAnswered);
              await db.add(`user.${participant}.winGame`, 1);
            }
            await ctx.sendMessage(
              ctx.id,
              {
                text: formatter.quote(
                  `🎉 Congratulations! All answers have been answered! Each member who answered gets ${game.coin.allAnswered} coins.`
                ),
                footer: config.msg.footer,
                buttons: playAgain,
              },
              {
                quoted: m,
              }
            );
          }
        } else if (participantAnswer === 'surrender') {
          const remaining = [...game.answers]
            .map(tools.msg.ucwords)
            .join(', ')
            .replace(/, ([^,]*)$/, ', and $1');
          session.delete(ctx.id);
          collector.stop();
          await ctx.sendMessage(
            ctx.id,
            {
              text: `${formatter.quote('🏳️ You surrendered!')}
${formatter.quote(`The unanswered answers are ${remaining}.`)}`,
              footer: config.msg.footer,
              buttons: playAgain,
            },
            {
              quoted: m,
            }
          );
        } else if (didYouMean(participantAnswer, [game.answer]) === game.answer) {
          await ctx.sendMessage(
            ctx.id,
            {
              text: formatter.quote('🎯 A little more!'),
            },
            {
              quoted: m,
            }
          );
        }
      });

      collector.on('end', async () => {
        const remaining = [...game.answers]
          .map(tools.msg.ucwords)
          .join(', ')
          .replace(/, ([^,]*)$/, ', and $1');

        if (session.has(ctx.id)) {
          session.delete(ctx.id);
          await ctx.reply({
            text: `${formatter.quote('⏱ Time is up!')}
${formatter.quote(`The unanswered answers are ${remaining}`)}`,
            footer: config.msg.footer,
            buttons: playAgain,
          });
        }
      });
    } catch (error) {
      await tools.cmd.handleError(ctx, error, true);
    }
  },
};

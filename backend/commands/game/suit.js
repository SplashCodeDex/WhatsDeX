const session = new Map();

export default {
  name: 'suit',
  category: 'game',
  permissions: {
    group: true,
  },
  code: async ctx => {
    const { formatter, tools, config, database: db } = ctx.bot.context;
    const accountJid = (await ctx.getMentioned())[0] || ctx.quoted?.senderJid || null;
    const accountId = ctx.getId(accountJid);

    const senderJid = ctx.sender.jid;
    const senderId = ctx.getId(senderJid);

    if (!accountJid)
      await ctx.reply({
        text:
          `${formatter.quote(tools.msg.generateInstruction(['send'], ['text']))}\n` +
          `${formatter.quote(tools.msg.generateCmdExample(ctx.used, `@${senderId}`))}\n${formatter.quote(
            tools.msg.generateNotes([
              'Reply or quote a message to make the sender the target account.',
            ])
          )}`,
        mentions: [senderJid],
      });

    if (accountId === config.bot.id)
      return await ctx.reply(formatter.quote('Cannot challenge the bot!'));
    if (accountJid === senderJid)
      return await ctx.reply(formatter.quote('Cannot challenge yourself!'));

    const existingGame = [...session.values()].find(
      game => game.players.includes(senderJid) || game.players.includes(accountJid)
    );
    if (existingGame)
      return await ctx.reply(formatter.quote('One of the players is already in a game session!'));

    try {
      const game = {
        players: [senderJid, accountJid],
        coin: 10,
        timeout: 120000,
        choices: new Map(),
        started: false,
      };

      await ctx.reply({
        text: `${formatter.quote(`You challenged @${accountId} to a game of suit!`)}\n${formatter.quote(
          `Bonus: ${game.coin} Coins`
        )}`,
        mentions: [accountJid],
        footer: config.msg.footer,
        buttons: [
          {
            buttonId: 'accept',
            buttonText: {
              displayText: 'Accept',
            },
          },
          {
            buttonId: 'reject',
            buttonText: {
              displayText: 'Reject',
            },
          },
        ],
      });

      session.set(senderJid, game);
      session.set(accountJid, game);

      const collector = ctx.MessageCollector({
        filter: m => [senderJid, accountJid].includes(m.sender),
        time: game.timeout,
        hears: [senderJid, accountJid],
      });

      collector.on('collect', async m => {
        const participantAnswer = m.content.toLowerCase();
        const participantJid = m.sender;
        const participantId = ctx.getId(participantJid);
        const isGroup = m.jid.endsWith('@g.us');

        if (!game.started && isGroup && participantId === accountId) {
          if (participantAnswer === 'accept') {
            game.started = true;
            await ctx.sendMessage(
              m.jid,
              {
                text: formatter.quote(
                  `@${accountId} accepted the challenge! Please make your choice in a private chat.`
                ),
                mentions: [accountJid],
              },
              {
                quoted: m,
              }
            );

            const choiceText = formatter.quote('Please choose one:');
            const buttons = [
              {
                buttonId: 'rock',
                buttonText: {
                  displayText: 'Rock',
                },
              },
              {
                buttonId: 'paper',
                buttonText: {
                  displayText: 'Paper',
                },
              },
              {
                buttonId: 'scissors',
                buttonText: {
                  displayText: 'Scissors',
                },
              },
            ];

            await ctx.sendMessage(senderJid, {
              text: choiceText,
              footer: config.msg.footer,
              buttons,
            });
            await ctx.sendMessage(accountJid, {
              text: choiceText,
              footer: config.msg.footer,
              buttons,
            });
          } else if (participantAnswer === 'reject') {
            session.delete(senderJid);
            session.delete(accountJid);
            await ctx.sendMessage(
              m.jid,
              {
                text: formatter.quote(`@${accountId} rejected the suit challenge.`),
                mentions: [accountJid],
              },
              {
                quoted: m,
              }
            );
          }
        }

        if (!isGroup && game.started) {
          const choices = {
            rock: {
              index: 0,
              name: 'Rock',
            },
            paper: {
              index: 1,
              name: 'Paper',
            },
            scissors: {
              index: 2,
              name: 'Scissors',
            },
          };
          const choiceData = choices[participantAnswer];

          if (choiceData) {
            game.choices.set(participantId, choiceData);

            await ctx.sendMessage(
              participantJid,
              {
                text: formatter.quote(`You chose: ${choiceData.name}`),
              },
              {
                quoted: m,
              }
            );

            if (game.choices.size === 2) {
              const [sChoice, aChoice] = [game.choices.get(senderId), game.choices.get(accountId)];

              const result = (3 + sChoice.index - aChoice.index) % 3;
              let winnerText;
              let coinText = 'No one wins, no one gets coins';

              if (result === 0) {
                winnerText = "It's a draw!";
              } else if (result === 1) {
                winnerText = `@${senderId} wins!`;
                await db.add(`user.${senderId}.coin`, game.coin);
                await db.add(`user.${senderId}.winGame`, 1);
                coinText = `+${game.coin} Coins for @${senderId}`;
              } else {
                winnerText = `@${accountId} wins!`;
                await db.add(`user.${accountId}.coin`, game.coin);
                await db.add(`user.${accountId}.winGame`, 1);
                coinText = `+${game.coin} Coins for @${accountId}`;
              }

              await ctx.reply({
                text:
                  `${formatter.quote('Suit results:')}\n` +
                  `${formatter.quote(`@${senderId}: ${sChoice.name}`)}\n` +
                  `${formatter.quote(`@${accountId}: ${aChoice.name}`)}\n` +
                  `${formatter.quote(winnerText)}\n${formatter.quote(coinText)}`,
                mentions: [senderJid, accountJid],
              });

              session.delete(senderJid);
              session.delete(accountJid);
            }
          }
        }
      });

      collector.on('end', async () => {
        if (session.has(senderJid) || session.has(accountJid)) {
          session.delete(senderJid);
          session.delete(accountJid);
          await ctx.reply(formatter.quote('⏱ Time is up!'));
        }
      });
    } catch (error) {
      await tools.cmd.handleError(ctx, error);
    }
  },
};

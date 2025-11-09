export default {
  name: 'setprofile',
  aliases: ['set', 'setp', 'setprof'],
  category: 'profile',
  code: async ctx => {
    const { formatter, tools, config, database: db } = ctx.bot.context;
    const input = ctx.args.join(' ') || null;

    if (!input)
      return await ctx.reply(
        `${formatter.quote(tools.msg.generateInstruction(['send'], ['text']))}\n` +
          `${formatter.quote(tools.msg.generateCmdExample(ctx.used, 'autolevelup'))}\n${formatter.quote(
            tools.msg.generateNotes([
              `Type ${formatter.inlineCode(`${ctx.used.prefix + ctx.used.command} list`)} to see the list.`,
            ])
          )}`
      );

    if (input.toLowerCase() === 'list') {
      const listText = await tools.list.get('setprofile');
      return await ctx.reply({
        text: listText,
        footer: config.msg.footer,
      });
    }

    try {
      const senderId = ctx.getId(ctx.sender.jid);
      const { args } = ctx;
      const command = args[0]?.toLowerCase();

      switch (command) {
        case 'username': {
          const input = args.slice(1).join(' ').trim();

          if (!input)
            return await ctx.reply(
              formatter.quote('❎ Please enter the username you want to use.')
            );
          if (/[^a-zA-Z0-9._-]/.test(input))
            return await ctx.reply(
              formatter.quote(
                '❎ Username can only contain letters, numbers, dots (.), underscores (_) or hyphens (-).'
              )
            );

          const usernameTaken = Object.values((await db.get('user')) || {}).some(
            user => user.username === input
          );
          if (usernameTaken)
            return await ctx.reply(
              formatter.quote('❎ That username is already used by another user.')
            );

          const username = `@${input}`;
          await db.set(`user.${senderId}.username`, username);
          await ctx.reply(
            formatter.quote(
              `✅ Username successfully changed to ${formatter.inlineCode(username)}!`
            )
          );
          break;
        }
        case 'autolevelup': {
          const setKey = `user.${senderId}.autolevelup`;
          const currentStatus = (await db.get(setKey)) || false;
          const newStatus = !currentStatus;
          await db.set(setKey, newStatus);

          const statusText = newStatus ? 'enabled' : 'disabled';
          await ctx.reply(formatter.quote(`✅ Auto level up successfully ${statusText}!`));
          break;
        }
        default:
          await ctx.reply(
            formatter.quote(`❎ Setting ${formatter.inlineCode(input)} is not valid.`)
          );
      }
    } catch (error) {
      await tools.cmd.handleError(ctx, error);
    }
  },
};

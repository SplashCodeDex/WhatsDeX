export default {
  name: 'setname',
  category: 'group',
  permissions: {
    admin: true,
    botAdmin: true,
    group: true,
  },
  code: async ctx => {
    const { formatter, tools } = ctx.bot.context;
    const input = ctx.args.join(' ') || null;

    if (!input)
      return await ctx.reply(
        `${formatter.quote(tools.msg.generateInstruction(['send'], ['text']))}\n${formatter.quote(
          tools.msg.generateCmdExample(ctx.used, 'whatsdex')
        )}`
      );

    try {
      await ctx.group().updateSubject(input);

      await ctx.reply(formatter.quote('✅ Successfully changed the group name!'));
    } catch (error) {
      await tools.cmd.handleError(ctx, error);
    }
  },
};

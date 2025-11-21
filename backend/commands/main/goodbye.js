export default {
  name: 'goodbye',
  category: 'main',
  handler: async (
    ctx,
    {
      // destructure context here
    }
  ) => {
    ctx.reply('Goodbye! Have a great day!');
  },
};

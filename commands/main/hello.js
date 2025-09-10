module.exports = {
  name: 'hello',
  category: 'main',
  handler: async (ctx, { 
    // destructure context here
  }) => {
    ctx.reply('Hello! How can I help you today?');
  },
};
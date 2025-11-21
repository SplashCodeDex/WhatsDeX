export default {
  startQuiz: async (ctx) => {
    ctx.reply('Math quiz service is currently under maintenance.');
  },
  checkAnswer: async (ctx, answer) => {
    return false;
  }
};

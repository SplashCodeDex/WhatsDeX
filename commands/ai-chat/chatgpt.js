const OpenAIService = require('../../services/openai');
const aiTools = require('../../tools/ai-tools');
const aiChatDB = require('../../database/ai_chat_database');

// Constants for summarization logic
const SUMMARIZE_THRESHOLD = 16;
const MESSAGES_TO_SUMMARIZE = 10;
const HISTORY_PRUNE_LENGTH = 6;

module.exports = {
  name: 'chatgpt',
  aliases: ['ai', 'ask', 'chat'],
  category: 'ai-chat',
  permissions: {
    coin: 15,
  },
  code: async (ctx) => {
    const { config, formatter } = ctx.bot.context;
    const input = ctx.args.join(' ') || ctx.quoted?.content || null;

    if (!config.api.openai) {
      return ctx.reply(formatter.quote('⛔ OpenAI API key is not configured.'));
    }

    if (!input) {
      return ctx.reply(formatter.quote('Please provide an input text.'));
    }

    try {
      const openAIService = new OpenAIService(config.api.openai);
      const userId = ctx.author.id;

      const chat = await aiChatDB.getChat(userId) || { history: [], summary: '' };
      let currentHistory = chat.history || [];
      let currentSummary = chat.summary || '';

      // Summarization Logic
      if (currentHistory.length >= SUMMARIZE_THRESHOLD) {
        const messagesToSummarize = currentHistory.slice(0, MESSAGES_TO_SUMMARIZE);
        if (messagesToSummarize.length > 0) {
          const newSummary = await openAIService.getSummary(messagesToSummarize);
          currentSummary = currentSummary ? `${currentSummary}\n\n${newSummary}` : newSummary;
          currentHistory = currentHistory.slice(-HISTORY_PRUNE_LENGTH);
          await aiChatDB.updateChat(userId, { history: currentHistory, summary: currentSummary });
        }
      }

      const systemMessage = `You are a helpful assistant. You can use tools to answer questions.${currentSummary ? `\n\nSummary of past conversation:\n${currentSummary}` : ''}`;
      const messages = [
        { role: 'system', content: systemMessage },
        ...currentHistory,
        { role: 'user', content: input },
      ];

      const response = await openAIService.getChatCompletion(messages, aiTools);
      const responseMessage = response.message;

      if (response.finish_reason === 'tool_calls' && responseMessage.tool_calls) {
        messages.push(responseMessage);
        // eslint-disable-next-line no-restricted-syntax
        for (const toolCall of responseMessage.tool_calls) {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);
          const commandToExecute = ctx.bot.cmd.get(functionName);
          let toolResponse = 'Error: Command not found.';
          if (commandToExecute) {
            try {
              let commandOutput = '';
              const mockCtx = { ...ctx, args: Object.values(functionArgs), reply: (output) => { commandOutput = typeof output === 'object' ? JSON.stringify(output) : output; } };
              // eslint-disable-next-line no-await-in-loop
              await commandToExecute.code(mockCtx);
              toolResponse = commandOutput;
            } catch (e) { toolResponse = `Error: ${e.message}`; }
          }
          messages.push({
            tool_call_id: toolCall.id, role: 'tool', name: functionName, content: toolResponse,
          });
        }

        const finalResponse = await openAIService.getChatCompletion(messages);
        const finalMessageContent = finalResponse.message.content;
        messages.push(finalResponse.message);
        await aiChatDB.updateChat(userId, { history: messages, summary: currentSummary });
        return ctx.reply(finalMessageContent);
      }
      const result = responseMessage.content;
      messages.push(responseMessage);
      await aiChatDB.updateChat(userId, { history: messages, summary: currentSummary });
      return ctx.reply(result);
    } catch (error) {
      console.error(error);
      return ctx.reply(formatter.quote(`An error occurred: ${error.message}`));
    }
  },
};

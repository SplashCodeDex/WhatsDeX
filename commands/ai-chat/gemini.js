const z = require('zod');
const GeminiService = require('../../services/gemini');
const aiTools = require('../../tools/ai-tools');
const aiChatDB = require('../../database/ai_chat_database');

// Constants for summarization logic
const {
  SUMMARIZE_THRESHOLD = 16,
  MESSAGES_TO_SUMMARIZE = 10,
  HISTORY_PRUNE_LENGTH = 6
} = ctx.bot.context.config.ai.summarization;

module.exports = {
  name: 'gemini',
  category: 'ai-chat',
  permissions: {
    coin: 10,
  },
  code: async (ctx) => {
    const { formatter } = ctx.bot.context;

    try {
      const input = ctx.args.join(' ') || ctx.quoted?.content || '';

      // Validation
      const inputSchema = z.string().min(1, { message: 'Please provide an input text.' });
      const validationResult = inputSchema.safeParse(input);
      if (!validationResult.success) {
        return ctx.reply(formatter.quote(`❎ ${validationResult.error.issues[0].message}`));
      }
      const validatedInput = validationResult.data;

      // Service call with tool handling
      const geminiService = new GeminiService();
      const userId = ctx.author.id;

      const chat = await aiChatDB.getChat(userId) || { history: [], summary: '' };
      let currentHistory = chat.history || [];
      let currentSummary = chat.summary || '';

      // Summarization Logic
      if (currentHistory.length >= SUMMARIZE_THRESHOLD) {
        const messagesToSummarize = currentHistory.slice(0, MESSAGES_TO_SUMMARIZE);
        if (messagesToSummarize.length > 0) {
          const newSummary = await geminiService.getSummary(messagesToSummarize);
          currentSummary = currentSummary ? `${currentSummary}\n\n${newSummary}` : newSummary;
          currentHistory = currentHistory.slice(-HISTORY_PRUNE_LENGTH);
          // The database update will happen in the next step.
        }
      }

      const systemMessage = `You are a helpful assistant. You can use tools to answer questions.${currentSummary ? `\n\nSummary of past conversation:\n${currentSummary}` : ''}`;
      const messages = [
        { role: 'system', content: systemMessage },
        ...currentHistory,
        { role: 'user', content: validatedInput },
      ];

      const response = await geminiService.getChatCompletionWithTools(messages, aiTools);
      const responseMessage = response.message;

      if (response.finish_reason === 'tool_calls' && responseMessage.tool_calls) {
        messages.push(responseMessage);

        for (const toolCall of responseMessage.tool_calls) {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);
          const commandToExecute = ctx.bot.cmd.get(functionName);
          let toolResponse = 'Error: Command not found.';

          if (commandToExecute) {
            try {
              let commandOutput = '';
              // The weather command expects args to be a string, not an array.
              // We need to handle different argument structures.
              const argsForCommand = functionName === 'weather' ?
                Object.values(functionArgs).join(' ') :
                Object.values(functionArgs);

              const mockCtx = {
                ...ctx,
                args: argsForCommand,
                reply: (output) => {
                  commandOutput = typeof output === 'object' ? JSON.stringify(output) : output;
                }
              };
              await commandToExecute.code(mockCtx);
              toolResponse = commandOutput;
            } catch (e) {
              toolResponse = `Error executing tool ${functionName}: ${e.message}`;
            }
          }

          messages.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            name: functionName,
            content: toolResponse,
          });
        }

        const finalResponse = await geminiService.getChatCompletionWithTools(messages, aiTools);
        const finalMessageContent = finalResponse.message.content;
        messages.push(finalResponse.message);
        await aiChatDB.updateChat(userId, { history: messages.slice(1), summary: currentSummary });
        return ctx.reply(finalMessageContent);

      } else {
        const result = responseMessage.content;
        messages.push(responseMessage);
        await aiChatDB.updateChat(userId, { history: messages.slice(1), summary: currentSummary });
        return ctx.reply(result);
      }
    } catch (error) {
      console.error(error);
      return ctx.reply(formatter.quote(`An error occurred: ${error.message}`));
    }
  },
};

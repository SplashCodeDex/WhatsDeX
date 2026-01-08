import { z } from 'zod';
import GeminiService from '../../services/gemini';
import aiTools from '../../tools/ai-tools';
import aiChatDB from '../../database/ai_chat_database';
// import dbManager from '../../src/utils/DatabaseManager';
import performanceMonitor from '../../src/utils/PerformanceMonitor';
import { RateLimiter } from '../../src/utils/RateLimiter';
import cache from '../../lib/cache';

import redisClient from '../../lib/redis';

// Initialize rate limiter
const rateLimiter = new RateLimiter(redisClient);

// Constants for summarization logic
export default {
  name: 'gemini',
  category: 'ai-chat',
  permissions: {
    coin: 10,
  },
  code: async ctx => {
    const { formatter } = ctx.bot.context;

    // Constants for summarization logic
    const {
      SUMMARIZE_THRESHOLD = 16,
      MESSAGES_TO_SUMMARIZE = 10,
      HISTORY_PRUNE_LENGTH = 6,
    } = ctx.bot.context.config.ai.summarization;

    // Start performance monitoring
    const timer = performanceMonitor.startTimer('gemini_command_execution', {
      userId: ctx.author.id,
      hasQuoted: !!ctx.quoted
    });

    try {
      const input = ctx.args.join(' ') || ctx.quoted?.content || '';

      // ADDED: Rate limiting check
      const rateLimitResult = await rateLimiter.checkCommandRateLimit(ctx.author.id, 'gemini');
      if (!rateLimitResult.allowed) {
        return ctx.reply(formatter.quote(`⏰ Rate limit exceeded for ${rateLimitResult.failedCheck}. Try again later.`));
      }

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

      const chat = (await aiChatDB.getChat(userId)) || { history: [], summary: '' };
      let currentHistory = chat.history || [];
      let currentSummary = chat.summary || '';

      // FIXED: Enhanced Summarization Logic with proper memory management
      if (currentHistory.length >= SUMMARIZE_THRESHOLD) {
        const messagesToSummarize = currentHistory.slice(0, MESSAGES_TO_SUMMARIZE);
        if (messagesToSummarize.length > 0) {
          try {
            const newSummary = await geminiService.getSummary(messagesToSummarize);

            // Limit summary length to prevent unbounded growth
            const maxSummaryLength = 1000;
            if (currentSummary) {
              const combinedSummary = `${currentSummary}\\n\\n${newSummary}`;
              currentSummary = combinedSummary.length > maxSummaryLength
                ? combinedSummary.substring(combinedSummary.length - maxSummaryLength)
                : combinedSummary;
            } else {
              currentSummary = newSummary.length > maxSummaryLength
                ? newSummary.substring(0, maxSummaryLength)
                : newSummary;
            }

            // Keep only recent messages
            currentHistory = currentHistory.slice(-HISTORY_PRUNE_LENGTH);

            console.log(`Memory optimized: History=${currentHistory.length}, Summary=${currentSummary.length} chars`);
          } catch (summaryError) {
            console.warn('Summary generation failed, using fallback truncation:', summaryError.message);
            // Fallback: just truncate history without summarizing
            currentHistory = currentHistory.slice(-HISTORY_PRUNE_LENGTH);
          }
        }
      }

      const systemMessage = `You are a helpful assistant. You can use tools to answer questions.${currentSummary ? `\n\nSummary of past conversation:\n${currentSummary}` : ''}`;
      const messages = [
        { role: 'system', content: systemMessage },
        ...currentHistory,
        { role: 'user', content: validatedInput },
      ];

      // --- Caching Implementation Start ---
      const cacheKey = cache.createKey(messages);
      const cachedResponse = await cache.get(cacheKey);

      if (cachedResponse) {
        console.log(`✅ Cache hit for key: ${cacheKey}`);
        timer.end();
        return ctx.reply(cachedResponse);
      }
      console.log(`❌ Cache miss for key: ${cacheKey}`);
      // --- Caching Implementation End ---

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
              const argsForCommand =
                functionName === 'weather'
                  ? Object.values(functionArgs).join(' ')
                  : Object.values(functionArgs);

              const mockCtx = {
                ...ctx,
                args: argsForCommand,
                reply: output => {
                  commandOutput = typeof output === 'object' ? JSON.stringify(output) : output;
                },
                // Remove dangerous properties
                group: undefined,
                sender: { jid: ctx.sender.jid },
                isGroup: ctx.isGroup,
                getId: ctx.getId,
              };
              await commandToExecute.code(mockCtx);
              toolResponse = commandOutput;
              console.log(`Tool execution success: ${functionName}`);
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

        // --- Caching Implementation Start ---
        await cache.set(cacheKey, finalMessageContent);
        console.log(`✅ Result stored in cache for key: ${cacheKey}`);
        // --- Caching Implementation End ---

        return ctx.reply(finalMessageContent);
      }
      const result = responseMessage.content;
      messages.push(responseMessage);
      await aiChatDB.updateChat(userId, { history: messages.slice(1), summary: currentSummary });

      // --- Caching Implementation Start ---
      await cache.set(cacheKey, result);
      console.log(`✅ Result stored in cache for key: ${cacheKey}`);
      // --- Caching Implementation End ---

      timer.end();
      return ctx.reply(result);
    } catch (error) {
      timer.end();
      console.error('Gemini command error:', error);

      // Log error with context
      const input = ctx.args.join(' ') || ctx.quoted?.content || '';
      console.error('Error details:', {
        userId: ctx.author.id,
        input: input?.substring(0, 100),
        error: error.message,
        stack: error.stack?.split('\n').slice(0, 5)
      });

      return ctx.reply(formatter.quote(`An error occurred: ${error.message}`));
    }
  },
};

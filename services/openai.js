const axios = require('axios');

class OpenAIService {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required.');
    }
    this.apiKey = apiKey;
    this.apiClient = axios.create({
      baseURL: 'https://api.openai.com/v1',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
    });
  }

  async getChatCompletion(messages, tools = null, correlationId = null) {
    const logger = require('../src/utils/logger');
    const maxRetries = 3;
    const baseDelay = 1000;

    const payload = {
      model: 'gpt-3.5-turbo-1106',
      messages,
      temperature: 0.7,
    };

    if (tools) {
      payload.tools = tools;
      payload.tool_choice = 'auto';
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info('OpenAI chat completion request', {
          correlationId,
          attempt,
          model: payload.model,
          messageCount: messages.length,
          toolsEnabled: !!tools,
        });

        const response = await this.apiClient.post('/chat/completions', payload);
        logger.info('OpenAI chat completion success', {
          correlationId,
          attempt,
          responseLength: response.data.choices[0].message.content?.length || 0,
        });
        return response.data.choices[0];
      } catch (error) {
        logger.warn('OpenAI chat completion attempt failed', {
          correlationId,
          attempt,
          maxRetries,
          error: error.message,
          status: error.response?.status,
          retryAfter: attempt < maxRetries ? baseDelay * 2 ** (attempt - 1) : null,
        });

        if (
          attempt === maxRetries ||
          !error.response ||
          [500, 502, 503, 504].includes(error.response.status)
        ) {
          if (error.response && error.response.data && error.response.data.error) {
            throw new Error(`OpenAI API Error: ${error.response.data.error.message}`);
          }
          throw error;
        }

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, baseDelay * 2 ** (attempt - 1)));
      }
    }
  }

  async getSummary(messages, correlationId = null) {
    const logger = require('../src/utils/logger');
    const maxRetries = 3;
    const baseDelay = 1000;

    const summarizationPrompt = {
      role: 'system',
      content:
        'You are a summarization expert. Summarize the key points, topics, and any user preferences mentioned in the following conversation. The summary should be a dense, concise paragraph. It will be used as context for a future conversation.',
    };

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info('OpenAI summary request', {
          correlationId,
          attempt,
          model: 'gpt-3.5-turbo',
          messageCount: messages.length,
        });

        const response = await this.apiClient.post('/chat/completions', {
          model: 'gpt-3.5-turbo',
          messages: [summarizationPrompt, ...messages],
          temperature: 0.2,
        });

        logger.info('OpenAI summary success', {
          correlationId,
          attempt,
          summaryLength: response.data.choices[0].message.content?.length || 0,
        });
        return response.data.choices[0].message.content;
      } catch (error) {
        logger.warn('OpenAI summary attempt failed', {
          correlationId,
          attempt,
          maxRetries,
          error: error.message,
          status: error.response?.status,
          retryAfter: attempt < maxRetries ? baseDelay * 2 ** (attempt - 1) : null,
        });

        if (
          attempt === maxRetries ||
          !error.response ||
          [500, 502, 503, 504].includes(error.response.status)
        ) {
          if (error.response && error.response.data && error.response.data.error) {
            throw new Error(
              `OpenAI API Error (Summarization): ${error.response.data.error.message}`
            );
          }
          throw error;
        }

        await new Promise(resolve => setTimeout(resolve, baseDelay * 2 ** (attempt - 1)));
      }
    }
  }
}

module.exports = OpenAIService;

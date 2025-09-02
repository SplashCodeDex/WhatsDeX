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
                'Authorization': `Bearer ${this.apiKey}`
            }
        });
    }

    async getChatCompletion(messages, tools = null) {
        const payload = {
            model: 'gpt-3.5-turbo-1106',
            messages: messages,
            temperature: 0.7
        };

        if (tools) {
            payload.tools = tools;
            payload.tool_choice = 'auto';
        }

        try {
            const response = await this.apiClient.post('/chat/completions', payload);
            return response.data.choices[0];
        } catch (error) {
            if (error.response && error.response.data && error.response.data.error) {
                throw new Error(`OpenAI API Error: ${error.response.data.error.message}`);
            }
            throw error;
        }
    }

    async getSummary(messages) {
        const summarizationPrompt = {
            role: 'system',
            content: 'You are a summarization expert. Summarize the key points, topics, and any user preferences mentioned in the following conversation. The summary should be a dense, concise paragraph. It will be used as context for a future conversation.'
        };

        try {
            const response = await this.apiClient.post('/chat/completions', {
                model: 'gpt-3.5-turbo',
                messages: [summarizationPrompt, ...messages],
                temperature: 0.2
            });
            return response.data.choices[0].message.content;
        } catch (error) {
            if (error.response && error.response.data && error.response.data.error) {
                throw new Error(`OpenAI API Error (Summarization): ${error.response.data.error.message}`);
            }
            throw error;
        }
    }
}

module.exports = OpenAIService;

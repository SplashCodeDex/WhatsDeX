const axios = require('axios');
const { createUrl } = require('../tools/api');

class GeminiService {
  constructor() {
    // The existing command uses a proxy service via createUrl,
    // so no API key is needed in the constructor for now.
  }

  /**
   * Get a chat completion from the Gemini API proxy.
   * @param {string} text - The user's input text.
   * @returns {Promise<string>} The response text from the AI.
   */
  async getChatCompletion(text) {
    if (!text) {
      throw new Error('Input text is required.');
    }

    try {
      const apiUrl = createUrl('davidcyril', '/ai/gemini', {
        text,
      });
      const response = await axios.get(apiUrl);

      // Based on the original gemini.js command
      if (response.data && response.data.message) {
        return response.data.message;
      }

      throw new Error('Invalid response format from Gemini API proxy.');
    } catch (error) {
      console.error('Error fetching Gemini completion:', error);
      throw new Error('Failed to get response from Gemini API proxy.');
    }
  }

  /**
   * Get a chat completion from the Gemini API proxy, with tools.
   * @param {Array<object>} messages - The message history.
   * @param {Array<object>} tools - The tools the model can use.
   * @returns {Promise<object>} The full response object from the API.
   */
  async getChatCompletionWithTools(messages, tools) {
    if (!messages || messages.length === 0) {
      throw new Error('Messages are required.');
    }

    try {
      // This is an assumption based on how such proxies often work.
      // The actual API endpoint and parameter names might differ.
      const apiUrl = createUrl('davidcyril', '/ai/gemini/with-tools', {
        messages: JSON.stringify(messages),
        tools: JSON.stringify(tools),
      });
      const response = await axios.get(apiUrl);

      if (response.data) {
        return response.data;
      }

      throw new Error('Invalid response format from Gemini API proxy.');
    } catch (error) {
      console.error('Error fetching Gemini completion with tools:', error);
      throw new Error('Failed to get response from Gemini API proxy with tools.');
    }
  }
}

module.exports = GeminiService;

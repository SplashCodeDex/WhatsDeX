const axios = require('axios');

class MetaAIService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.meta.ai/v1'; // Hypothetical endpoint; replace with actual Meta AI API
  }

  async generateReply(prompt, options = {}) {
    try {
      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: options.model || 'llama-3.1-8b',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options.maxTokens || 150,
        temperature: options.temperature || 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Meta AI reply generation error:', error);
      throw new Error('Failed to generate AI reply');
    }
  }

  async transcribeVoice(audioBuffer) {
    try {
      const response = await axios.post(`${this.baseURL}/audio/transcriptions`, {
        file: audioBuffer,
        model: 'whisper-1' // Assuming Meta uses Whisper-like model
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data.text;
    } catch (error) {
      console.error('Meta AI voice transcription error:', error);
      throw new Error('Failed to transcribe voice');
    }
  }

  async generateImage(prompt) {
    try {
      const response = await axios.post(`${this.baseURL}/images/generations`, {
        prompt,
        n: 1,
        size: '512x512'
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.data[0].url;
    } catch (error) {
      console.error('Meta AI image generation error:', error);
      throw new Error('Failed to generate image');
    }
  }

  async analyzeImage(imageUrl, prompt = 'Describe this image') {
    try {
      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: 'llama-3.1-vision',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }
        ]
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Meta AI image analysis error:', error);
      throw new Error('Failed to analyze image');
    }
  }
}

module.exports = MetaAIService;
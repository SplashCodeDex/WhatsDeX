import OpenAI from 'openai';

export class EmbeddingService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.model = 'text-embedding-3-small'; // 5x cheaper than ada-002!
    this.maxRetries = 3;
    this.baseDelay = 2000; // 2s base delay
  }

  async generateEmbedding(text) {
    // Input validation and preprocessing
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid input: text must be a non-empty string');
    }
    
    // Clean and truncate text (embedding model has token limits)
    const cleanText = this.preprocessText(text);
    
    // Retry logic with exponential backoff
    return await this.withRetry(async () => {
      const response = await this.client.embeddings.create({
        model: this.model,
        input: cleanText,
        encoding_format: 'float'
      });
      
      return response.data[0].embedding; // 1536-dimensional vector
    });
  }

  preprocessText(text) {
    // Clean whitespace, limit length for token efficiency
    return text.trim().substring(0, 8000); // ~8k chars ≈ safe token limit
  }

  async withRetry(operation) {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === this.maxRetries) throw error;
        
        const delay = this.baseDelay * Math.pow(2, attempt - 1); // 2s→4s→8s
        console.warn(`Embedding API attempt ${attempt} failed, retrying in ${delay}ms:`, error.message);
        await this.sleep(delay);
      }
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new EmbeddingService(); // Singleton instance
import { PrismaClient } from '@prisma/client';
import embeddingService from './EmbeddingService.js';

export class MemoryService {
  constructor() {
    this.prisma = new PrismaClient();
    this.similarityThreshold = 0.75; // Configurable relevance threshold
    this.maxContexts = 5; // Maximum historical contexts to retrieve
  }

  /**
   * Store a conversation snippet with its vector embedding
   * Runs asynchronously in the background
   */
  async storeConversation(userId, conversationText, metadata = {}) {
    try {
      // Generate embedding for the conversation
      const embedding = await embeddingService.generateEmbedding(conversationText);
      
      // Convert embedding array to pgvector format
      const vectorString = `[${embedding.join(',')}]`;
      
      // Store using Prisma raw query for vector operations
      await this.prisma.$executeRaw`
        INSERT INTO "ConversationEmbedding" (id, "userId", content, embedding, metadata)
        VALUES (gen_random_uuid(), ${userId}, ${conversationText}, ${vectorString}::vector, ${JSON.stringify(metadata)}::jsonb)
      `;
      
      console.log(`Stored conversation embedding for user ${userId}`);
    } catch (error) {
      console.error('Error storing conversation embedding:', error);
      // Don't throw - background operation should not break main flow
    }
  }

  /**
   * Retrieve relevant historical contexts for a new user message
   * Uses cosine similarity search with pgvector
   */
  async retrieveRelevantContext(userId, newText) {
    try {
      // Generate embedding for the new message
      const queryEmbedding = await embeddingService.generateEmbedding(newText);
      const queryVector = `[${queryEmbedding.join(',')}]`;

      // Perform cosine similarity search
      const results = await this.prisma.$queryRaw`
        SELECT 
          id,
          content,
          timestamp,
          metadata,
          1 - (embedding <=> ${queryVector}::vector) as similarity
        FROM "ConversationEmbedding"
        WHERE "userId" = ${userId}
          AND 1 - (embedding <=> ${queryVector}::vector) > ${this.similarityThreshold}
        ORDER BY similarity DESC
        LIMIT ${this.maxContexts}
      `;

      // Format results for AI context injection
      return results.map(result => ({
        content: result.content,
        timestamp: result.timestamp,
        similarity: parseFloat(result.similarity),
        metadata: result.metadata
      }));

    } catch (error) {
      console.error('Error retrieving context:', error);
      return []; // Return empty array on error - don't break the conversation
    }
  }

  /**
   * Get conversation statistics for a user
   */
  async getConversationStats(userId) {
    try {
      const stats = await this.prisma.$queryRaw`
        SELECT 
          COUNT(*) as total_conversations,
          MIN(timestamp) as first_conversation,
          MAX(timestamp) as last_conversation
        FROM "ConversationEmbedding"
        WHERE "userId" = ${userId}
      `;

      return stats[0];
    } catch (error) {
      console.error('Error getting conversation stats:', error);
      return null;
    }
  }

  /**
   * Clean up old conversation embeddings (for maintenance)
   */
  async cleanupOldConversations(daysToKeep = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await this.prisma.$executeRaw`
        DELETE FROM "ConversationEmbedding"
        WHERE timestamp < ${cutoffDate}
      `;

      console.log(`Cleaned up old conversations, deleted ${result} records`);
      return result;
    } catch (error) {
      console.error('Error cleaning up conversations:', error);
      return 0;
    }
  }

  /**
   * Update similarity threshold for relevance filtering
   */
  setSimilarityThreshold(threshold) {
    if (threshold >= 0 && threshold <= 1) {
      this.similarityThreshold = threshold;
      console.log(`Updated similarity threshold to ${threshold}`);
    } else {
      throw new Error('Similarity threshold must be between 0 and 1');
    }
  }

  /**
   * Update maximum contexts to retrieve
   */
  setMaxContexts(maxContexts) {
    if (maxContexts > 0) {
      this.maxContexts = maxContexts;
      console.log(`Updated max contexts to ${maxContexts}`);
    } else {
      throw new Error('Max contexts must be greater than 0');
    }
  }
}

export default new MemoryService(); // Singleton instance
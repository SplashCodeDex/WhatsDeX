
import { db } from '../lib/firebase.js';
import embeddingService from './embeddingService.js';
import { Timestamp } from 'firebase-admin/firestore';

// Include logger if available in context, or import default
import logger from '../utils/logger.js';

export class MemoryService {
  private context: any;
  private similarityThreshold: number;
  private maxContexts: number;

  constructor(context: any = {}) {
    this.context = { logger, ...context };
    this.similarityThreshold = 0.75;
    this.maxContexts = 5;
  }

  /**
   * Store a conversation snippet with its vector embedding
   * Runs asynchronously in the background
   */
  async storeConversation(userId, conversationText, metadata = {}) {
    try {
      // Generate embedding for the conversation
      const embedding = await embeddingService.generateEmbedding(conversationText);

      // Store in Firestore
      await db.collection('conversation_embeddings').add({
        userId,
        content: conversationText,
        embedding, // Store as array of numbers
        metadata,
        timestamp: Timestamp.now()
      });

      this.context.logger.info(`Stored conversation embedding for user ${userId}`);
    } catch (error: any) {
      this.context.logger.error('Error storing conversation embedding:', error);
    }
  }

  /**
   * Retrieve relevant historical contexts for a new user message
   * Uses client-side cosine similarity search (inefficient for large datasets but works for Firestore without Vector Search)
   */
  async retrieveRelevantContext(userId, newText) {
    try {
      // Generate embedding for the new message
      const queryEmbedding = await embeddingService.generateEmbedding(newText);

      // Fetch all embeddings for this user (Warning: Heavy if user has many messages)
      // Optimization: Limit to last N messages or use a dedicated Vector DB
      const snapshot = await db.collection('conversation_embeddings')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(100) // Hard limit to prevent memory explosion
        .get();

      if (snapshot.empty) return [];

      const documents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Calculate similarities
      const results = documents.map((doc: any) => {
        const similarity = this.cosineSimilarity(queryEmbedding, doc.embedding);
        return {
          content: doc.content,
          timestamp: doc.timestamp instanceof Timestamp ? doc.timestamp.toDate() : doc.timestamp,
          similarity,
          metadata: doc.metadata
        };
      });

      // Filter and Sort
      return results
        .filter(r => r.similarity > this.similarityThreshold)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, this.maxContexts);

    } catch (error: any) {
      this.context.logger.error('Error retrieving context:', error);
      return [];
    }
  }

  // Helper for Cosine Similarity
  cosineSimilarity(vecA: number[], vecB: number[]) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Get conversation statistics for a user
   */
  async getConversationStats(userId) {
    try {
      // Aggregations
      const coll = db.collection('conversation_embeddings').where('userId', '==', userId);
      const snapshot = await coll.count().get();
      const count = snapshot.data().count;

      // Min/Max timestamp via separate queries
      // Efficient for First/Last
      const first = await coll.orderBy('timestamp', 'asc').limit(1).get();
      const last = await coll.orderBy('timestamp', 'desc').limit(1).get();

      return {
        total_conversations: count,
        first_conversation: first.empty ? null : (first.docs[0].data().timestamp as Timestamp).toDate(),
        last_conversation: last.empty ? null : (last.docs[0].data().timestamp as Timestamp).toDate()
      };
    } catch (error: any) {
      this.context.logger.error('Error getting conversation stats:', error);
      return null;
    }
  }

  /**
   * Clean up old conversation embeddings (for maintenance)
   */
  async cleanupOldConversations(daysToKeep = 30) {
    try {
      const cutoffDate = Timestamp.fromMillis(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

      const snapshot = await db.collection('conversation_embeddings')
        .where('timestamp', '<', cutoffDate)
        .get();

      const batch = db.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();

      this.context.logger.info(`Cleaned up old conversations, deleted ${snapshot.size} records`);
      return snapshot.size;
    } catch (error: any) {
      this.context.logger.error('Error cleaning up conversations:', error);
      return 0;
    }
  }

  setSimilarityThreshold(threshold) {
    if (threshold >= 0 && threshold <= 1) {
      this.similarityThreshold = threshold;
      this.context.logger.info(`Updated similarity threshold to ${threshold}`);
    } else {
      throw new Error('Similarity threshold must be between 0 and 1');
    }
  }

  setMaxContexts(maxContexts) {
    if (maxContexts > 0) {
      this.maxContexts = maxContexts;
      this.context.logger.info(`Updated max contexts to ${maxContexts}`);
    } else {
      throw new Error('Max contexts must be greater than 0');
    }
  }
}

export default new MemoryService();

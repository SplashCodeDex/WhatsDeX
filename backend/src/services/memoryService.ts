import { firebaseService } from './FirebaseService.js';
import { embeddingService } from './embeddingService.js';
import { Timestamp } from 'firebase-admin/firestore';
import logger from '../utils/logger.js';
import { Result } from '../types/index.js';
import { admin } from '../lib/firebase.js';

interface ConversationEmbedding {
  userId: string;
  content: string;
  embedding: number[];
  metadata: Record<string, any>;
  timestamp: Timestamp;
}

interface ConversationContext {
  content: string;
  timestamp: Date;
  similarity: number;
  metadata: Record<string, any>;
}

export class MemoryService {
  private static instance: MemoryService;
  private similarityThreshold: number;
  private maxContexts: number;

  private constructor() {
    this.similarityThreshold = 0.75;
    this.maxContexts = 5;
  }

  public static getInstance(): MemoryService {
    if (!MemoryService.instance) {
      MemoryService.instance = new MemoryService();
    }
    return MemoryService.instance;
  }

  /**
   * Store a conversation snippet with its vector embedding
   */
  async storeConversation(userId: string, conversationText: string, metadata: Record<string, any> = {}): Promise<Result<void>> {
    try {
      const embeddingResult = await embeddingService.generateEmbedding(conversationText);
      if (!embeddingResult.success || !embeddingResult.data) {
        throw new Error('Failed to generate embedding');
      }

      await firebaseService.addDoc('conversation_embeddings' as any, {
        userId,
        content: conversationText,
        embedding: embeddingResult.data,
        metadata,
        timestamp: Timestamp.now()
      } as any);

      logger.info(`Stored conversation embedding for user ${userId}`);
      return { success: true, data: undefined };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Error storing conversation embedding:', err);
      return { success: false, error: err };
    }
  }

  /**
   * Retrieve relevant historical contexts
   */
  async retrieveRelevantContext(userId: string, newText: string): Promise<Result<ConversationContext[]>> {
    try {
      const queryEmbeddingResult = await embeddingService.generateEmbedding(newText);
      if (!queryEmbeddingResult.success || !queryEmbeddingResult.data) {
        throw new Error('Failed to generate query embedding');
      }
      const queryEmbedding = queryEmbeddingResult.data;

      const docs = await firebaseService.getCollection('conversation_embeddings' as any, undefined, {
        where: [['userId', '==', userId]],
        orderBy: { field: 'timestamp', direction: 'desc' },
        limit: 100
      });

      if (docs.length === 0) return { success: true, data: [] };

      const results = docs.map(data => {
        const embeddingData = data as any as ConversationEmbedding;
        const similarity = this.cosineSimilarity(queryEmbedding, embeddingData.embedding);
        return {
          content: embeddingData.content,
          timestamp: embeddingData.timestamp.toDate(),
          similarity,
          metadata: embeddingData.metadata
        };
      });

      const filtered = results
        .filter(r => r.similarity > this.similarityThreshold)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, this.maxContexts);

      return { success: true, data: filtered };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Error retrieving context:', err);
      return { success: false, error: err };
    }
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
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

  async getConversationStats(userId: string): Promise<Result<{ total: number; first: Date | null; last: Date | null }>> {
    try {
      const count = await firebaseService.getCount('conversation_embeddings' as any, undefined, [
        ['userId', '==', userId]
      ]);

      const firstDocs = await firebaseService.getCollection('conversation_embeddings' as any, undefined, {
        where: [['userId', '==', userId]],
        orderBy: { field: 'timestamp', direction: 'asc' },
        limit: 1
      });

      const lastDocs = await firebaseService.getCollection('conversation_embeddings' as any, undefined, {
        where: [['userId', '==', userId]],
        orderBy: { field: 'timestamp', direction: 'desc' },
        limit: 1
      });

      return {
        success: true,
        data: {
          total: count,
          first: firstDocs.length === 0 ? null : (firstDocs[0].timestamp as any as Timestamp).toDate(),
          last: lastDocs.length === 0 ? null : (lastDocs[0].timestamp as any as Timestamp).toDate()
        }
      };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Error getting conversation stats:', err);
      return { success: false, error: err };
    }
  }

  async cleanupOldConversations(daysToKeep = 30): Promise<Result<number>> {
    try {
      const cutoffDate = Timestamp.fromMillis(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

      // Use FirebaseService for querying
      const docs = await firebaseService.getCollection('conversation_embeddings' as any, undefined, {
        where: [['timestamp', '<', cutoffDate]]
      });

      // We need document references to delete.
      // Since firebaseService.getCollection returns parsed data, we'll need to use direct db here
      // for the deletion part or extend FirebaseService to return refs.
      // For now, let's keep it simple and just use direct db for this specific cleanup task
      // as it's a maintenance task.
      const { db } = await import('../lib/firebase.js');
      const snapshot = await db.collection('conversation_embeddings')
        .where('timestamp', '<', cutoffDate)
        .get();

      const batch = firebaseService.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();

      logger.info(`Cleaned up old conversations, deleted ${snapshot.size} records`);
      return { success: true, data: snapshot.size };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Error cleaning up conversations:', err);
      return { success: false, error: err };
    }
  }

  setSimilarityThreshold(threshold: number): void {
    if (threshold >= 0 && threshold <= 1) {
      this.similarityThreshold = threshold;
      logger.info(`Updated similarity threshold to ${threshold}`);
    } else {
      throw new Error('Similarity threshold must be between 0 and 1');
    }
  }

  setMaxContexts(maxContexts: number): void {
    if (maxContexts > 0) {
      this.maxContexts = maxContexts;
      logger.info(`Updated max contexts to ${maxContexts}`);
    } else {
      throw new Error('Max contexts must be greater than 0');
    }
  }
}

export const memoryService = MemoryService.getInstance();
export default memoryService;
import { db } from '../lib/firebase.js';
import { embeddingService } from './embeddingService.js';
import { firebaseService } from './FirebaseService.js';
import { Timestamp } from 'firebase-admin/firestore';
import logger from '../utils/logger.js';
import { Result } from '../types/index.js';
import { ConversationEmbedding } from '../types/contracts.js';
import crypto from 'node:crypto';

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
  async storeConversation(tenantId: string, userId: string, conversationText: string, metadata: Record<string, any> = {}): Promise<Result<void>> {
    try {
      const embeddingResult = await embeddingService.generateEmbedding(conversationText);
      if (!embeddingResult.success || !embeddingResult.data) {
        throw new Error('Failed to generate embedding');
      }

      const id = crypto.randomUUID();
      await firebaseService.setDoc<'tenants/{tenantId}/embeddings'>(
        'embeddings',
        id,
        {
          id,
          userId,
          content: conversationText,
          embedding: embeddingResult.data,
          metadata,
          timestamp: new Date()
        },
        tenantId
      );

      logger.info(`Stored conversation embedding for user ${userId} in tenant ${tenantId}`);
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
  async retrieveRelevantContext(tenantId: string, userId: string, newText: string): Promise<Result<ConversationContext[]>> {
    try {
      const queryEmbeddingResult = await embeddingService.generateEmbedding(newText);
      if (!queryEmbeddingResult.success || !queryEmbeddingResult.data) {
        throw new Error('Failed to generate query embedding');
      }
      const queryEmbedding = queryEmbeddingResult.data;

      // Scalable Firestore Query: Filter by userId, Order by timestamp, Limit 100
      const snapshot = await db.collection('tenants')
        .doc(tenantId)
        .collection('embeddings')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(100)
        .get();

      if (snapshot.empty) return { success: true, data: [] };

      const results = snapshot.docs.map(doc => {
        const data = doc.data() as ConversationEmbedding;
        const similarity = this.cosineSimilarity(queryEmbedding, data.embedding);
        return {
          content: data.content,
          timestamp: (data.timestamp as any).toDate ? (data.timestamp as any).toDate() : new Date(data.timestamp as any),
          similarity,
          metadata: data.metadata
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

  async getConversationStats(tenantId: string, userId: string): Promise<Result<{ total: number; first: Date | null; last: Date | null }>> {
    try {
      const coll = db.collection('tenants').doc(tenantId).collection('embeddings').where('userId', '==', userId);
      const snapshot = await coll.count().get();
      const count = snapshot.data().count;

      const first = await coll.orderBy('timestamp', 'asc').limit(1).get();
      const last = await coll.orderBy('timestamp', 'desc').limit(1).get();

      return {
        success: true,
        data: {
          total: count,
          first: first.empty ? null : ((first.docs[0].data().timestamp as any).toDate ? (first.docs[0].data().timestamp as any).toDate() : new Date(first.docs[0].data().timestamp as any)),
          last: last.empty ? null : ((last.docs[0].data().timestamp as any).toDate ? (last.docs[0].data().timestamp as any).toDate() : new Date(last.docs[0].data().timestamp as any))
        }
      };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Error getting conversation stats:', err);
      return { success: false, error: err };
    }
  }

  async cleanupOldConversations(tenantId: string, daysToKeep = 30): Promise<Result<number>> {
    try {
      const cutoffDate = Timestamp.fromMillis(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
      const snapshot = await db.collection('tenants')
        .doc(tenantId)
        .collection('embeddings')
        .where('timestamp', '<', cutoffDate)
        .get();

      if (snapshot.empty) return { success: true, data: 0 };

      const batch = db.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();

      logger.info(`Cleaned up old conversations for tenant ${tenantId}, deleted ${snapshot.size} records`);
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
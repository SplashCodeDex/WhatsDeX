import { firebaseService } from './FirebaseService.js';
import { embeddingService } from './embeddingService.js';
import { admin } from '../lib/firebase.js';
import logger from '../utils/logger.js';
import { Result } from '../types/index.js';
import { Timestamp } from 'firebase-admin/firestore';

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
  async storeConversation(tenantId: string, userId: string, conversationText: string, metadata: Record<string, any> = {}): Promise<Result<void>> {
    try {
      const embeddingResult = await embeddingService.generateEmbedding(conversationText);
      if (!embeddingResult.success || !embeddingResult.data) {
        throw new Error('Failed to generate embedding');
      }

      const id = admin.firestore().collection('tenants').doc(tenantId).collection('embeddings').doc().id;

      await firebaseService.setDoc<'tenants/{tenantId}/embeddings'>('embeddings', id, {
        userId,
        content: conversationText,
        embedding: embeddingResult.data,
        metadata,
        timestamp: Timestamp.now()
      } as any, tenantId, false);

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

      // In 2026, we use direct Firestore query with filters to prevent OOM
      // Note: We use logical collection name 'embeddings' for firebaseService if we were to use getCollection,
      // but since we need where clauses and ordering, we use direct db access but ensure tenantId isolation.
      const snapshot = await admin.firestore().collection('tenants')
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
          timestamp: data.timestamp.toDate(),
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

  async getConversationStats(userId: string, tenantId: string): Promise<Result<{ total: number; first: Date | null; last: Date | null }>> {
    try {
      const coll = admin.firestore().collection('tenants').doc(tenantId).collection('embeddings').where('userId', '==', userId);
      const snapshot = await coll.count().get();
      const count = snapshot.data().count;

      const first = await coll.orderBy('timestamp', 'asc').limit(1).get();
      const last = await coll.orderBy('timestamp', 'desc').limit(1).get();

      return {
        success: true,
        data: {
          total: count,
          first: first.empty ? null : (first.docs[0].data().timestamp as Timestamp).toDate(),
          last: last.empty ? null : (last.docs[0].data().timestamp as Timestamp).toDate()
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
      const snapshot = await admin.firestore().collection('tenants')
        .doc(tenantId)
        .collection('embeddings')
        .where('timestamp', '<', cutoffDate)
        .get();

      const batch = admin.firestore().batch();
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
}

export const memoryService = MemoryService.getInstance();
export default memoryService;

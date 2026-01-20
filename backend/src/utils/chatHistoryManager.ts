/**
 * Chat History Manager with Size Limits and Intelligent Summarization
 * Prevents infinite growth while maintaining context
 */

import { MemoryManager } from './memoryManager.js';
import { db } from '../lib/firebase.js';
import { Timestamp } from 'firebase-admin/firestore';
import { logger } from './logger.js';

export class ChatHistoryManager {
  maxHistoryLength: number;
  maxSummaryLength: number;
  compressionThreshold: number;
  memoryManager: MemoryManager;

  constructor(options: any = {}) {
    this.maxHistoryLength = options.maxHistoryLength || 50;
    this.maxSummaryLength = options.maxSummaryLength || 1000;
    this.compressionThreshold = options.compressionThreshold || 30;
    this.memoryManager = new MemoryManager({
      maxSize: options.maxUsers || 10000,
      ttl: options.userTTL || 7200000 // 2 hours
    });
  }

  async getChat(userId: string) {
    let chat = this.memoryManager.get(userId);

    if (!chat) {
      // Load from database if not in memory
      chat = await this.loadFromDatabase(userId);
      if (!chat) {
        chat = { history: [], summary: '', lastActivity: Date.now() };
      }
      this.memoryManager.set(userId, chat);
    }

    return chat;
  }

  async addMessage(userId: string, role: string, content: string) {
    const chat = await this.getChat(userId);

    // Add new message
    chat.history.push({
      role,
      content,
      timestamp: Date.now()
    });

    // Update last activity
    chat.lastActivity = Date.now();

    // Check if we need to compress history
    if (chat.history.length > this.maxHistoryLength) {
      await this.compressHistory(chat);
    }

    // Save back to memory
    this.memoryManager.set(userId, chat);

    // Async save to database (don't wait)
    this.saveToDatabase(userId, chat).catch(err => logger.error('Async save history failed', { error: err }));

    return chat;
  }

  /**
   * Directly update chat state (useful for replacing history)
   */
  async updateChat(userId: string, updates: { history?: any[], summary?: string }) {
    const chat = await this.getChat(userId);
    if (updates.history) chat.history = updates.history;
    if (updates.summary !== undefined) chat.summary = updates.summary;
    chat.lastActivity = Date.now();

    this.memoryManager.set(userId, chat);
    await this.saveToDatabase(userId, chat);
    return chat;
  }

  async compressHistory(chat: any) {
    // Keep recent messages and summarize older ones
    const recentMessages = chat.history.slice(-this.compressionThreshold);
    const oldMessages = chat.history.slice(0, -this.compressionThreshold);

    if (oldMessages.length > 0) {
      // Create summary of old messages
      const oldSummary = await this.summarizeMessages(oldMessages);

      // Combine with existing summary
      if (chat.summary) {
        chat.summary = await this.combineSummaries(chat.summary, oldSummary);
      } else {
        chat.summary = oldSummary;
      }

      // Trim summary if too long
      if (chat.summary.length > this.maxSummaryLength) {
        chat.summary = chat.summary.substring(0, this.maxSummaryLength) + '...';
      }
    }

    // Keep only recent messages
    chat.history = recentMessages;

    logger.info(`Compressed history for user ${chat.history.length} messages, summary: ${chat.summary.length} chars`);
  }

  async summarizeMessages(messages: any[]) {
    // Create a concise summary of the messages
    const userMessages = messages.filter(m => m.role === 'user').length;
    const assistantMessages = messages.filter(m => m.role === 'assistant').length;

    const topics = this.extractTopics(messages);
    const timespan = this.getTimespan(messages);

    return `Previous conversation (${timespan}): ${userMessages} user messages, ${assistantMessages} responses. Topics discussed: ${topics.join(', ')}.`;
  }

  extractTopics(messages: any[]) {
    const topics = new Set();
    const keywords = ['help', 'question', 'problem', 'how', 'what', 'why', 'when', 'where'];

    messages.forEach(message => {
      keywords.forEach(keyword => {
        if (message.content.toLowerCase().includes(keyword)) {
          topics.add(keyword);
        }
      });
    });

    return Array.from(topics).slice(0, 5); // Max 5 topics
  }

  getTimespan(messages: any[]) {
    if (messages.length === 0) return 'unknown time';

    const start = messages[0].timestamp;
    const end = messages[messages.length - 1].timestamp;
    const duration = end - start;

    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  async combineSummaries(oldSummary: string, newSummary: string) {
    // Intelligently combine summaries
    return `${oldSummary} | ${newSummary}`;
  }

  async loadFromDatabase(userId: string) {
    try {
      const snapshot = await db.collection('conversation_memory')
        .where('userId', '==', userId)
        .limit(1)
        .get();

      if (snapshot.empty) return null;

      const record = snapshot.docs[0].data();
      let history = [];
      try {
        history = typeof record.messages === 'string' ? JSON.parse(record.messages) : record.messages;
      } catch (_) {
        history = [];
      }
      return {
        history,
        summary: record.summary || '',
        lastActivity: record.lastUpdated ? (record.lastUpdated instanceof Timestamp ? record.lastUpdated.toMillis() : Date.now()) : Date.now()
      };
    } catch (error: any) {
      logger.error('Error loading chat from database:', { error: error });
      return null;
    }
  }

  async saveToDatabase(userId: string, chat: any) {
    try {
      // Ensure we store messages as JSON string or objects. Firestore handles objects well.
      // But looking at load, it tries JSON.parse. I will store as JSON string to be safe
      // or change load to accept objects.
      // Let's store as object array if possible, but Firestore has limits on document size/depth.
      // JSON string is safer for complex message structures.
      const messagesJson = JSON.stringify(chat.history);

      const snapshot = await db.collection('conversation_memory')
        .where('userId', '==', userId)
        .limit(1)
        .get();

      const data = {
        userId,
        messages: messagesJson,
        summary: chat.summary,
        lastUpdated: Timestamp.now()
      };

      if (!snapshot.empty) {
        await snapshot.docs[0].ref.update(data);
      } else {
        await db.collection('conversation_memory').add(data);
      }
    } catch (error: any) {
      logger.error('Error saving chat to database:', { error: error });
    }
  }

  // Get statistics
  getStats() {
    const memStats = this.memoryManager.getStats();
    return {
      activeChats: memStats.size,
      memoryUsage: memStats.memoryUsage,
      maxHistoryLength: this.maxHistoryLength,
      compressionThreshold: this.compressionThreshold
    };
  }

  // Cleanup inactive users
  async cleanupInactiveUsers(inactivityThreshold = 24 * 60 * 60 * 1000) { // 24 hours
    const cutoff = Timestamp.fromMillis(Date.now() - inactivityThreshold);
    try {
      const snapshot = await db.collection('conversation_memory').where('lastUpdated', '<', cutoff).get();
      const batch = db.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    } catch (e) {
      logger.error('Cleanup failed', { error: e });
    }
  }
}

export default new ChatHistoryManager();

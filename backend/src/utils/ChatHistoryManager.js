/**
 * Chat History Manager with Size Limits and Intelligent Summarization
 * Prevents infinite growth while maintaining context
 */

import { MemoryManager } from './MemoryManager.js';

export class ChatHistoryManager {
  constructor(options = {}) {
    this.maxHistoryLength = options.maxHistoryLength || 50;
    this.maxSummaryLength = options.maxSummaryLength || 1000;
    this.compressionThreshold = options.compressionThreshold || 30;
    this.memoryManager = new MemoryManager({
      maxSize: options.maxUsers || 10000,
      ttl: options.userTTL || 7200000 // 2 hours
    });
  }

  async getChat(userId) {
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

  async addMessage(userId, role, content) {
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
    this.saveToDatabase(userId, chat).catch(console.error);
    
    return chat;
  }

  async compressHistory(chat) {
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
    
    console.log(`Compressed history for user ${chat.history.length} messages, summary: ${chat.summary.length} chars`);
  }

  async summarizeMessages(messages) {
    // Create a concise summary of the messages
    const userMessages = messages.filter(m => m.role === 'user').length;
    const assistantMessages = messages.filter(m => m.role === 'assistant').length;
    
    const topics = this.extractTopics(messages);
    const timespan = this.getTimespan(messages);
    
    return `Previous conversation (${timespan}): ${userMessages} user messages, ${assistantMessages} responses. Topics discussed: ${topics.join(', ')}.`;
  }

  extractTopics(messages) {
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

  getTimespan(messages) {
    if (messages.length === 0) return 'unknown time';
    
    const start = messages[0].timestamp;
    const end = messages[messages.length - 1].timestamp;
    const duration = end - start;
    
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  async combineSummaries(oldSummary, newSummary) {
    // Intelligently combine summaries
    return `${oldSummary} | ${newSummary}`;
  }

  async loadFromDatabase(userId) {
    try {
      const { default: prisma } = await import('../lib/prisma.js');
      // Load latest conversation memory for this user
      const record = await prisma.conversationMemory.findFirst({
        where: { userId },
        orderBy: { lastUpdated: 'desc' },
      });
      if (!record) return null;
      let history = [];
      try {
        history = JSON.parse(record.messages);
      } catch (_) {
        history = [];
      }
      return { history, summary: '', lastActivity: Date.now() };
    } catch (error) {
      console.error('Error loading chat from database:', error);
      return null;
    }
  }

  async saveToDatabase(userId, chat) {
    try {
      const { default: prisma } = await import('../lib/prisma.js');
      const messagesJson = JSON.stringify(chat.history.slice(-this.maxHistoryLength));
      const existing = await prisma.conversationMemory.findFirst({ where: { userId }, orderBy: { lastUpdated: 'desc' } });
      if (existing) {
        await prisma.conversationMemory.update({ where: { id: existing.id }, data: { messages: messagesJson } });
      } else {
        await prisma.conversationMemory.create({ data: { userId, messages: messagesJson } });
      }
    } catch (error) {
      console.error('Error saving chat to database:', error);
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
  cleanupInactiveUsers(inactivityThreshold = 24 * 60 * 60 * 1000) { // 24 hours
    const now = Date.now();
    const inactiveUsers = [];
    
    // This would need to iterate through stored chats
    // Implementation depends on storage method
  }
}
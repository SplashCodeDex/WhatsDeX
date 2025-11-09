// AI Chat Database functionality
class AIChatDatabase {
  constructor() {
    this.chatHistory = new Map();
  }

  addMessage(userId, message, role = 'user') {
    if (!this.chatHistory.has(userId)) {
      this.chatHistory.set(userId, []);
    }
    
    this.chatHistory.get(userId).push({
      role,
      content: message,
      timestamp: Date.now()
    });
  }

  getHistory(userId, limit = 10) {
    return this.chatHistory.get(userId)?.slice(-limit) || [];
  }

  clearHistory(userId) {
    this.chatHistory.delete(userId);
  }
}

export default new AIChatDatabase();
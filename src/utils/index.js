import DatabaseService from '../services/database.js';

// Initialize singleton database instance
const db = new DatabaseService();

// Collector utility (if exists, otherwise create stub)
const collector = {
  // Add collector methods if needed
  createCollector: (conn, opts) => {
    // Implementation
  },
};

// Group mentions handler
const groupMentions = async (conn, groupId) => {
  // Implementation
};

export {
  db,
  collector,
  groupMentions,
  DatabaseService,
};

export default {
  db,
  collector,
  groupMentions,
  DatabaseService,
};

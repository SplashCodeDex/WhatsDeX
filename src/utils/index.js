const DatabaseService = require('../services/database');

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

module.exports = {
  db,
  collector,
  groupMentions,
  DatabaseService,
};

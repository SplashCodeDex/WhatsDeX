// Mock Moderation Service for testing
// This will be replaced with actual database implementation in Phase 7.2

class ModerationService {
  constructor() {
    this.moderationQueue = [];
    this.userViolations = new Map();
    this.nextQueueId = 1;
    this.nextViolationId = 1;
    this.initializeMockData();
  }

  initializeMockData() {
    // Mock moderation queue items
    this.moderationQueue = [];
    this.nextQueueId = 1;

    // Mock user violations
    this.userViolations = new Map();
    this.nextViolationId = 1;
  }

  async getModerationQueue(filters = {}, options = {}) {
    const { page = 1, limit = 50 } = options;
    let items = [...this.moderationQueue];

    // Apply filters
    if (filters.status) {
      items = items.filter(item => item.status === filters.status);
    }

    if (filters.priority) {
      items = items.filter(item => item.priority === filters.priority);
    }

    if (filters.contentType) {
      items = items.filter(item => item.contentType === filters.contentType);
    }

    // Sort by createdAt desc
    items.sort((a, b) => b.createdAt - a.createdAt);

    const total = items.length;
    const startIndex = (page - 1) * limit;
    const paginatedItems = items.slice(startIndex, startIndex + limit);

    return {
      items: paginatedItems,
      total,
      page,
      limit,
    };
  }

  async getModerationQueueItem(id) {
    return this.moderationQueue.find(item => item.id === parseInt(id)) || null;
  }

  async reviewModerationItem(id, reviewData) {
    const item = this.moderationQueue.find(item => item.id === parseInt(id));
    if (!item) {
      throw new Error('Moderation queue item not found');
    }

    item.status = reviewData.action === 'approve' ? 'approved' : 'rejected';
    item.reviewedAt = new Date();
    item.moderatorId = reviewData.moderatorId;
    item.reviewNotes = reviewData.notes;

    return item;
  }

  async bulkReviewModerationItems(itemIds, reviewData) {
    const results = {
      successful: [],
      failed: [],
    };

    for (const itemId of itemIds) {
      try {
        const result = await this.reviewModerationItem(itemId, reviewData);
        results.successful.push(result);
      } catch (error) {
        results.failed.push({ id: itemId, error: error.message });
      }
    }

    return results;
  }

  async getModerationStatistics(dateFilters = {}) {
    let queueItems = [...this.moderationQueue];
    let violations = [];

    this.userViolations.forEach(userViolations => {
      violations.push(...userViolations);
    });

    // Apply date filters
    if (dateFilters.startDate) {
      const startDate = new Date(dateFilters.startDate);
      queueItems = queueItems.filter(item => item.createdAt >= startDate);
      violations = violations.filter(v => v.createdAt >= startDate);
    }

    if (dateFilters.endDate) {
      const endDate = new Date(dateFilters.endDate);
      queueItems = queueItems.filter(item => item.createdAt <= endDate);
      violations = violations.filter(v => v.createdAt <= endDate);
    }

    const totalQueued = queueItems.length;
    const pendingItems = queueItems.filter(item => item.status === 'pending').length;
    const reviewedItems = queueItems.filter(item => item.status !== 'pending').length;

    const totalViolations = violations.length;
    const activeViolations = violations.filter(v => v.status === 'active').length;

    // Violations by type
    const violationsByType = {};
    violations.forEach(v => {
      violationsByType[v.violationType] = (violationsByType[v.violationType] || 0) + 1;
    });

    // Violations by severity
    const violationsBySeverity = {};
    violations.forEach(v => {
      violationsBySeverity[v.severity] = (violationsBySeverity[v.severity] || 0) + 1;
    });

    return {
      queue: {
        totalQueued,
        pendingItems,
        reviewedItems,
        approvalRate:
          reviewedItems > 0
            ? (
              (queueItems.filter(item => item.status === 'approved').length / reviewedItems) *
              100
            ).toFixed(1)
            : 0,
      },
      violations: {
        totalViolations,
        activeViolations,
        violationsByType,
        violationsBySeverity,
      },
      timeRange: {
        startDate: dateFilters.startDate,
        endDate: dateFilters.endDate,
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  async getUserViolations(userId, filters = {}, options = {}) {
    const { page = 1, limit = 50 } = options;
    let violations = this.userViolations.get(userId) || [];

    // Apply filters
    if (filters.status) {
      violations = violations.filter(v => v.status === filters.status);
    }

    // Sort by createdAt desc
    violations.sort((a, b) => b.createdAt - a.createdAt);

    const total = violations.length;
    const startIndex = (page - 1) * limit;
    const paginatedViolations = violations.slice(startIndex, startIndex + limit);

    return {
      violations: paginatedViolations,
      total,
      page,
      limit,
    };
  }

  async addUserViolation(userId, violationData) {
    const violation = {
      id: this.nextViolationId++,
      userId,
      ...violationData,
      status: 'active',
      createdAt: new Date(),
    };

    if (!this.userViolations.has(userId)) {
      this.userViolations.set(userId, []);
    }

    this.userViolations.get(userId).push(violation);
    return violation;
  }

  async updateUserViolation(violationId, updateData) {
    for (const [userId, violations] of this.userViolations.entries()) {
      const violation = violations.find(v => v.id === parseInt(violationId));
      if (violation) {
        Object.assign(violation, updateData);
        return violation;
      }
    }
    return null;
  }

  async getModerationSettings() {
    return {
      contentModerationEnabled: true,
      autoModeration: true,
      moderationThreshold: 0.8,
      bannedWords: ['spam', 'scam', 'offensive'],
      maxMessageLength: 4096,
      rateLimitEnabled: true,
      spamDetectionEnabled: true,
    };
  }

  async updateModerationSettings(settings) {
    // In a real implementation, this would update the settings
    return {
      ...(await this.getModerationSettings()),
      ...settings,
      updatedAt: new Date().toISOString(),
    };
  }
}

export default new ModerationService();

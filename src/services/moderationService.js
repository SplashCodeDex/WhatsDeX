const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class ModerationService {
  async getModerationQueue(filters = {}, options = {}) {
    const { page = 1, limit = 50 } = options;
    const where = {};

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.priority) {
      where.priority = filters.priority;
    }
    if (filters.contentType) {
      where.contentType = filters.contentType;
    }

    const items = await prisma.moderationQueue.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
    const total = await prisma.moderationQueue.count({ where });

    return { items, total, page, limit };
  }

  async getModerationQueueItem(id) {
    return prisma.moderationQueue.findUnique({ where: { id } });
  }

  async reviewModerationItem(id, { action, moderatorId, notes }) {
    const status = action === 'approve' ? 'approved' : 'rejected';
    return prisma.moderationQueue.update({
      where: { id },
      data: {
        status,
        moderatorId,
        reviewNotes: notes,
        reviewedAt: new Date(),
      },
    });
  }

  async bulkReviewModerationItems(itemIds, reviewData) {
     const status = reviewData.action === 'approve' ? 'approved' : 'rejected';
     const updated = await prisma.moderationQueue.updateMany({
       where: { id: { in: itemIds } },
       data: {
        status,
        moderatorId: reviewData.moderatorId,
        reviewNotes: reviewData.notes,
        reviewedAt: new Date(),
       }
     })
    return {
      successful: updated.count,
      failed: itemIds.length - updated.count
    }
  }

  async getModerationStatistics(dateFilters = {}) {
    const where = {};
    if (dateFilters.startDate) {
      where.createdAt = { gte: new Date(dateFilters.startDate) };
    }
    if (dateFilters.endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(dateFilters.endDate) };
    }

    const totalQueued = await prisma.moderationQueue.count({ where });
    const pendingItems = await prisma.moderationQueue.count({ where: { ...where, status: 'pending' } });
    const reviewedItems = totalQueued - pendingItems;

    const violations = await prisma.userViolation.findMany({ where });
    const totalViolations = violations.length;
    const activeViolations = violations.filter(v => v.status === 'active').length;

    const violationsByType = violations.reduce((acc, v) => {
      acc[v.violationType] = (acc[v.violationType] || 0) + 1;
      return acc;
    }, {});

    const violationsBySeverity = violations.reduce((acc, v) => {
        acc[v.severity] = (acc[v.severity] || 0) + 1;
        return acc;
      }, {});

    return {
      queue: {
        totalQueued,
        pendingItems,
        reviewedItems,
      },
      violations: {
        totalViolations,
        activeViolations,
        violationsByType,
        violationsBySeverity,
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  async getUserViolations(userId, filters = {}, options = {}) {
    const { page = 1, limit = 50 } = options;
    const where = { userId };

    if (filters.status) {
      where.status = filters.status;
    }

    const violations = await prisma.userViolation.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
    const total = await prisma.userViolation.count({ where });

    return { violations, total, page, limit };
  }

  async addUserViolation(userId, violationData) {
    return prisma.userViolation.create({
      data: {
        userId,
        ...violationData,
        status: 'active',
      },
    });
  }

  async updateUserViolation(violationId, updateData) {
    return prisma.userViolation.update({
      where: { id: violationId },
      data: updateData,
    });
  }
}

module.exports = new ModerationService();

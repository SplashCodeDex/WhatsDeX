const AuditLogger = require('./auditLogger');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auditLogger = new AuditLogger({ prisma });

auditLogger.initialize();

class AuditService {
  async logEvent(eventData) {
    return auditLogger.logEvent(eventData);
  }

  async getAuditLogs(filters = {}, options = {}) {
    const { page = 1, limit = 50 } = options;
    const where = {};

    if (filters.eventType) where.eventType = filters.eventType;
    if (filters.actor) where.actor = { contains: filters.actor };
    if (filters.actorId) where.actorId = filters.actorId;
    if (filters.resource) where.resource = filters.resource;
    if (filters.resourceId) where.resourceId = filters.resourceId;
    if (filters.riskLevel) where.riskLevel = filters.riskLevel.toUpperCase();
    if (filters.startDate) where.createdAt = { gte: new Date(filters.startDate) };
    if (filters.endDate) where.createdAt = { ...where.createdAt, lte: new Date(filters.endDate) };

    const logs = await prisma.auditLog.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.auditLog.count({ where });

    return { logs, total, page, limit };
  }

  async getAuditLogById(id) {
    return prisma.auditLog.findUnique({ where: { id } });
  }

  async getStatistics(filters = {}) {
    return auditLogger.getStatistics(filters);
  }

  async exportAuditLogs(filters = {}, format = 'json') {
    return auditLogger.exportLogs(filters, format);
  }

  async getUserActivity(userId, dateFilters = {}, options = {}) {
    const filters = {
      actorId: userId,
      startDate: dateFilters.startDate,
      endDate: dateFilters.endDate,
    };
    return this.getAuditLogs(filters, options);
  }
}

module.exports = new AuditService();

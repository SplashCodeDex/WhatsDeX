const context = require('../../context');

class AuditService {
  constructor() {
    // Real audit service using Prisma database
  }

  async logEvent(eventData) {
    try {
      const logEntry = await context.database.auditLog.create({
        data: {
          eventType: eventData.eventType,
          actor: eventData.actor,
          actorId: eventData.actorId,
          action: eventData.action,
          resource: eventData.resource,
          resourceId: eventData.resourceId,
          details: eventData.details || {},
          riskLevel: eventData.riskLevel || 'LOW',
          ipAddress: eventData.ipAddress,
          userAgent: eventData.userAgent,
          sessionId: eventData.sessionId,
          location: eventData.location,
          metadata: eventData.metadata || {}
        }
      });

      return logEntry;
    } catch (error) {
      console.error('Error logging audit event:', error);
      throw error;
    }
  }

  async getAuditLogs(filters = {}, options = {}) {
    try {
      const { page = 1, limit = 50 } = options;

      // Build where clause for filters
      const where = {};

      if (filters.eventType) {
        where.eventType = filters.eventType;
      }

      if (filters.actor) {
        where.actor = { contains: filters.actor, mode: 'insensitive' };
      }

      if (filters.actorId) {
        where.actorId = filters.actorId;
      }

      if (filters.resource) {
        where.resource = filters.resource;
      }

      if (filters.resourceId) {
        where.resourceId = filters.resourceId;
      }

      if (filters.riskLevel) {
        where.riskLevel = filters.riskLevel.toUpperCase();
      }

      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          where.createdAt.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          where.createdAt.lte = new Date(filters.endDate);
        }
      }

      // Build orderBy
      const orderBy = {};
      if (filters.sortBy === 'eventType') {
        orderBy.eventType = filters.sortOrder === 'desc' ? 'desc' : 'asc';
      } else {
        orderBy.createdAt = filters.sortOrder === 'asc' ? 'asc' : 'desc';
      }

      // Get total count
      const total = await context.database.auditLog.count({ where });

      // Get paginated results
      const logs = await context.database.auditLog.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit
      });

      return {
        logs,
        total,
        page,
        limit
      };
    } catch (error) {
      console.error('Error getting audit logs:', error);
      throw error;
    }
  }

  async getAuditLogById(id) {
    try {
      return await context.database.auditLog.findUnique({
        where: { id: parseInt(id) }
      });
    } catch (error) {
      console.error('Error getting audit log by ID:', error);
      return null;
    }
  }

  async getStatistics(filters = {}) {
    try {
      // Build where clause for filters
      const where = {};

      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          where.createdAt.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          where.createdAt.lte = new Date(filters.endDate);
        }
      }

      const totalEvents = await context.database.auditLog.count({ where });

      // Events by type
      const eventsByTypeRaw = await context.database.auditLog.groupBy({
        by: ['eventType'],
        where,
        _count: { eventType: true }
      });

      const eventsByType = {};
      eventsByTypeRaw.forEach(item => {
        eventsByType[item.eventType] = item._count.eventType;
      });

      // Events by risk level
      const eventsByRiskRaw = await context.database.auditLog.groupBy({
        by: ['riskLevel'],
        where,
        _count: { riskLevel: true }
      });

      const eventsByRisk = {};
      eventsByRiskRaw.forEach(item => {
        eventsByRisk[item.riskLevel] = item._count.riskLevel;
      });

      // Recent events (last 10)
      const recentEvents = await context.database.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      return {
        totalEvents,
        eventsByType,
        eventsByRisk,
        recentEvents,
        timeRange: {
          startDate: filters.startDate,
          endDate: filters.endDate
        }
      };
    } catch (error) {
      console.error('Error getting audit statistics:', error);
      throw error;
    }
  }

  async exportAuditLogs(filters = {}, format = 'json') {
    const { logs } = await this.getAuditLogs(filters, { limit: 10000 });

    if (format === 'csv') {
      const headers = [
        'ID', 'Timestamp', 'Event Type', 'Actor', 'Actor ID', 'Action',
        'Resource', 'Resource ID', 'Risk Level', 'IP Address', 'Details'
      ];

      const rows = logs.map(log => [
        log.id,
        log.createdAt.toISOString(),
        log.eventType,
        log.actor || '',
        log.actorId || '',
        log.action,
        log.resource,
        log.resourceId || '',
        log.riskLevel,
        log.ipAddress || '',
        JSON.stringify(log.details).replace(/"/g, '""')
      ]);

      return [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
    }

    return JSON.stringify(logs, null, 2);
  }

  async getEventTypes() {
    try {
      const eventTypesRaw = await context.database.auditLog.groupBy({
        by: ['eventType'],
        _count: { eventType: true }
      });

      return eventTypesRaw.map(item => ({
        value: item.eventType,
        label: item.eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        count: item._count.eventType
      }));
    } catch (error) {
      console.error('Error getting event types:', error);
      return [];
    }
  }

  async searchAuditLogs(query, fields = ['actor', 'action', 'resource'], options = {}) {
    try {
      const { page = 1, limit = 50 } = options;
      const searchTerm = query.toLowerCase();

      // Build OR conditions for search
      const whereConditions = fields.map(field => ({
        [field]: { contains: searchTerm, mode: 'insensitive' }
      }));

      const where = { OR: whereConditions };

      const total = await context.database.auditLog.count({ where });

      const logs = await context.database.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      });

      return {
        logs,
        total,
        page,
        limit
      };
    } catch (error) {
      console.error('Error searching audit logs:', error);
      throw error;
    }
  }

  async getUserActivity(userId, dateFilters = {}, options = {}) {
    try {
      const { page = 1, limit = 50 } = options;

      const where = { actorId: userId };

      if (dateFilters.startDate || dateFilters.endDate) {
        where.createdAt = {};
        if (dateFilters.startDate) {
          where.createdAt.gte = new Date(dateFilters.startDate);
        }
        if (dateFilters.endDate) {
          where.createdAt.lte = new Date(dateFilters.endDate);
        }
      }

      const total = await context.database.auditLog.count({ where });

      const logs = await context.database.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      });

      return {
        logs,
        total,
        page,
        limit
      };
    } catch (error) {
      console.error('Error getting user activity:', error);
      throw error;
    }
  }

  async getResourceActivity(resource, resourceId, dateFilters = {}, options = {}) {
    try {
      const { page = 1, limit = 50 } = options;

      const where = {
        resource,
        resourceId
      };

      if (dateFilters.startDate || dateFilters.endDate) {
        where.createdAt = {};
        if (dateFilters.startDate) {
          where.createdAt.gte = new Date(dateFilters.startDate);
        }
        if (dateFilters.endDate) {
          where.createdAt.lte = new Date(dateFilters.endDate);
        }
      }

      const total = await context.database.auditLog.count({ where });

      const logs = await context.database.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      });

      return {
        logs,
        total,
        page,
        limit
      };
    } catch (error) {
      console.error('Error getting resource activity:', error);
      throw error;
    }
  }

  async cleanupOldLogs(days = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const deletedLogs = await context.database.auditLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          }
        }
      });

      return {
        deletedCount: deletedLogs.count,
        retentionDays: days,
        cutoffDate: cutoffDate.toISOString()
      };
    } catch (error) {
      console.error('Error cleaning up old logs:', error);
      throw error;
    }
  }
}

module.exports = new AuditService();
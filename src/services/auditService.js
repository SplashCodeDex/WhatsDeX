// Mock Audit Service for testing
// This will be replaced with actual database implementation in Phase 7.2

class AuditService {
  constructor() {
    this.auditLogs = [];
    this.nextId = 1;
    this.initializeMockData();
  }

  initializeMockData() {
    const mockLogs = [
      {
        id: 1,
        eventType: 'USER_REGISTER',
        actor: 'user-1',
        actorId: 'user-1',
        action: 'User account created',
        resource: 'user',
        resourceId: 'user-1',
        details: { userName: 'John Doe', userEmail: 'john@example.com' },
        riskLevel: 'LOW',
        ipAddress: '192.168.1.100',
        userAgent: 'WhatsApp/2.21.1.1',
        sessionId: 'session-123',
        location: 'New York, US',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        id: 2,
        eventType: 'ADMIN_USER_MANAGE',
        actor: 'admin-1',
        actorId: 'admin-1',
        action: 'Viewed user list',
        resource: 'users',
        details: { filters: { status: 'active' }, resultCount: 25 },
        riskLevel: 'LOW',
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        sessionId: 'admin-session-456',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
      },
      {
        id: 3,
        eventType: 'USER_UPDATE',
        actor: 'user-2',
        actorId: 'user-2',
        action: 'User account updated',
        resource: 'user',
        resourceId: 'user-2',
        details: { changes: { plan: 'pro' }, userName: 'Jane Smith' },
        riskLevel: 'MEDIUM',
        ipAddress: '192.168.1.102',
        userAgent: 'WhatsApp/2.21.1.1',
        sessionId: 'session-789',
        createdAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
      },
      {
        id: 4,
        eventType: 'ADMIN_SYSTEM_CONFIG',
        actor: 'admin-1',
        actorId: 'admin-1',
        action: 'Updated system setting',
        resource: 'setting',
        resourceId: 'security.maxLoginAttempts',
        details: { oldValue: 3, newValue: 5 },
        riskLevel: 'MEDIUM',
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        sessionId: 'admin-session-456',
        createdAt: new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
      },
      {
        id: 5,
        eventType: 'SECURITY_SUSPICIOUS_ACTIVITY',
        actor: 'system',
        action: 'Suspicious activity detected',
        resource: 'system',
        details: { type: 'rate_limit_exceeded', attempts: 150, threshold: 100 },
        riskLevel: 'HIGH',
        ipAddress: '10.0.0.50',
        userAgent: 'Unknown',
        createdAt: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
      }
    ];

    this.auditLogs = mockLogs;
    this.nextId = mockLogs.length + 1;
  }

  async logEvent(eventData) {
    const logEntry = {
      id: this.nextId++,
      ...eventData,
      createdAt: new Date(),
      metadata: eventData.metadata || {}
    };

    this.auditLogs.push(logEntry);
    return logEntry;
  }

  async getAuditLogs(filters = {}, options = {}) {
    const { page = 1, limit = 50 } = options;
    let logs = [...this.auditLogs];

    // Apply filters
    if (filters.eventType) {
      logs = logs.filter(log => log.eventType === filters.eventType);
    }

    if (filters.actor) {
      logs = logs.filter(log => log.actor && log.actor.toLowerCase().includes(filters.actor.toLowerCase()));
    }

    if (filters.actorId) {
      logs = logs.filter(log => log.actorId === filters.actorId);
    }

    if (filters.resource) {
      logs = logs.filter(log => log.resource === filters.resource);
    }

    if (filters.resourceId) {
      logs = logs.filter(log => log.resourceId === filters.resourceId);
    }

    if (filters.riskLevel) {
      logs = logs.filter(log => log.riskLevel === filters.riskLevel.toUpperCase());
    }

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      logs = logs.filter(log => log.createdAt >= startDate);
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      logs = logs.filter(log => log.createdAt <= endDate);
    }

    // Apply sorting
    logs.sort((a, b) => {
      if (filters.sortBy === 'eventType') {
        return filters.sortOrder === 'desc'
          ? b.eventType.localeCompare(a.eventType)
          : a.eventType.localeCompare(b.eventType);
      }
      // Default sort by createdAt desc
      return filters.sortOrder === 'asc'
        ? a.createdAt - b.createdAt
        : b.createdAt - a.createdAt;
    });

    const total = logs.length;
    const startIndex = (page - 1) * limit;
    const paginatedLogs = logs.slice(startIndex, startIndex + limit);

    return {
      logs: paginatedLogs,
      total,
      page,
      limit
    };
  }

  async getAuditLogById(id) {
    return this.auditLogs.find(log => log.id === parseInt(id)) || null;
  }

  async getStatistics(filters = {}) {
    let logs = [...this.auditLogs];

    // Apply date filters
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      logs = logs.filter(log => log.createdAt >= startDate);
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      logs = logs.filter(log => log.createdAt <= endDate);
    }

    const totalEvents = logs.length;

    // Events by type
    const eventsByType = {};
    logs.forEach(log => {
      eventsByType[log.eventType] = (eventsByType[log.eventType] || 0) + 1;
    });

    // Events by risk level
    const eventsByRisk = {};
    logs.forEach(log => {
      eventsByRisk[log.riskLevel] = (eventsByRisk[log.riskLevel] || 0) + 1;
    });

    // Recent events (last 10)
    const recentEvents = logs
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10);

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
    const eventTypes = [...new Set(this.auditLogs.map(log => log.eventType))];
    return eventTypes.map(type => ({
      value: type,
      label: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count: this.auditLogs.filter(log => log.eventType === type).length
    }));
  }

  async searchAuditLogs(query, fields = ['actor', 'action', 'resource'], options = {}) {
    const { page = 1, limit = 50 } = options;
    const searchTerm = query.toLowerCase();

    let logs = this.auditLogs.filter(log => {
      return fields.some(field => {
        const value = log[field];
        return value && value.toString().toLowerCase().includes(searchTerm);
      });
    });

    const total = logs.length;
    const startIndex = (page - 1) * limit;
    const paginatedLogs = logs.slice(startIndex, startIndex + limit);

    return {
      logs: paginatedLogs,
      total,
      page,
      limit
    };
  }

  async getUserActivity(userId, dateFilters = {}, options = {}) {
    const { page = 1, limit = 50 } = options;
    let logs = this.auditLogs.filter(log => log.actorId === userId);

    // Apply date filters
    if (dateFilters.startDate) {
      const startDate = new Date(dateFilters.startDate);
      logs = logs.filter(log => log.createdAt >= startDate);
    }

    if (dateFilters.endDate) {
      const endDate = new Date(dateFilters.endDate);
      logs = logs.filter(log => log.createdAt <= endDate);
    }

    const total = logs.length;
    const startIndex = (page - 1) * limit;
    const paginatedLogs = logs.slice(startIndex, startIndex + limit);

    return {
      logs: paginatedLogs,
      total,
      page,
      limit
    };
  }

  async getResourceActivity(resource, resourceId, dateFilters = {}, options = {}) {
    const { page = 1, limit = 50 } = options;
    let logs = this.auditLogs.filter(log => log.resource === resource && log.resourceId === resourceId);

    // Apply date filters
    if (dateFilters.startDate) {
      const startDate = new Date(dateFilters.startDate);
      logs = logs.filter(log => log.createdAt >= startDate);
    }

    if (dateFilters.endDate) {
      const endDate = new Date(dateFilters.endDate);
      logs = logs.filter(log => log.createdAt <= endDate);
    }

    const total = logs.length;
    const startIndex = (page - 1) * limit;
    const paginatedLogs = logs.slice(startIndex, startIndex + limit);

    return {
      logs: paginatedLogs,
      total,
      page,
      limit
    };
  }

  async cleanupOldLogs(days = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const oldLogs = this.auditLogs.filter(log => log.createdAt < cutoffDate);
    this.auditLogs = this.auditLogs.filter(log => log.createdAt >= cutoffDate);

    return {
      deletedCount: oldLogs.length,
      retentionDays: days,
      cutoffDate: cutoffDate.toISOString()
    };
  }
}

module.exports = new AuditService();
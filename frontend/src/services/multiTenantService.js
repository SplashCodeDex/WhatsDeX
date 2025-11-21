import apiClient from '../../lib/apiClient.js';

export class MultiTenantService {
  constructor() {
    this.apiClient = apiClient;
  }

  // Tenant Management
  async createTenant(data) {
    try {
      const response = await this.apiClient.createTenant(data);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getTenant(identifier) {
    try {
      const response = await this.apiClient.getTenant(identifier);
      return response;
    } catch (error) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async updateTenant(tenantId, data) {
    try {
      const response = await this.apiClient.updateTenant(tenantId, data);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // User Management
  async createTenantUser(tenantId, userData) {
    try {
      const response = await this.apiClient.createTenantUser(tenantId, userData);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async authenticateUser(tenantId, email, password) {
    try {
      const response = await this.apiClient.authenticateUser(tenantId, email, password);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Bot Instance Management
  async createBotInstance(tenantId, botData) {
    try {
      const response = await this.apiClient.createBotInstance(tenantId, botData);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async updateBotStatus(botInstanceId, status, sessionData = null) {
    try {
      const response = await this.apiClient.updateBotStatus(botInstanceId, status, sessionData);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // API Key Management
  async createApiKey(tenantId, name) {
    try {
      const response = await this.apiClient.createApiKey(tenantId, name);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async validateApiKey(apiKey) {
    try {
      const response = await this.apiClient.validateApiKey(apiKey);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Analytics
  async recordAnalytic(tenantId, metric, value, metadata = null) {
    try {
      const response = await this.apiClient.recordAnalytic(tenantId, metric, value, metadata);
      return response.data;
    } catch (error) {
      console.error('Failed to record analytics', error);
      // Don't throw for analytics failures
    }
  }

  async getAnalytics(tenantId, metrics, startDate, endDate) {
    try {
      const response = await this.apiClient.getAnalytics(tenantId, metrics, startDate, endDate);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Audit Logging
  async logAction(tenantId, userId, action, resource, resourceId, details, ipAddress, userAgent) {
    try {
      const response = await this.apiClient.logAction(tenantId, userId, action, resource, resourceId, details, ipAddress, userAgent);
      return response;
    } catch (error) {
      console.error('Failed to log action', error);
      // Don't throw for audit log failures
    }
  }

  // Plan Limits
  async checkPlanLimits(tenantId, resource) {
    try {
      const response = await this.apiClient.checkPlanLimits(tenantId, resource);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getCurrentUsage(tenantId, resource) {
    try {
      const response = await this.apiClient.getCurrentUsage(tenantId, resource);
      return response.usage;
    } catch (error) {
      console.error('Failed to get current usage', error);
      return 0;
    }
  }

  // Additional methods needed by web routes
  async getBots(tenantId) {
    try {
      const response = await this.apiClient.getTenantBots(tenantId);
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default new MultiTenantService();
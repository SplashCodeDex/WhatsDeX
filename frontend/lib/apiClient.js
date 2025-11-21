import axios from 'axios';

class APIClient {
  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    this.internalAPIKey = process.env.INTERNAL_API_KEY || 'internal-api-key-change-in-production';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'x-internal-api-key': this.internalAPIKey
      }
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        return response.data;
      },
      (error) => {
        console.error('API Response Error:', error.response?.data || error.message);
        
        // Extract error message from response
        const errorMessage = error.response?.data?.error || error.message || 'An error occurred';
        
        // Create a standardized error
        const apiError = new Error(errorMessage);
        apiError.status = error.response?.status;
        apiError.data = error.response?.data;
        
        return Promise.reject(apiError);
      }
    );
  }

  // Tenant Management
  async createTenant(tenantData) {
    return this.client.post('/api/internal/tenants', tenantData);
  }

  async getTenant(identifier) {
    return this.client.get(`/api/internal/tenants/${identifier}`);
  }

  async updateTenant(tenantId, data) {
    return this.client.put(`/api/internal/tenants/${tenantId}`, data);
  }

  // Authentication
  async authenticateUser(tenantId, email, password) {
    return this.client.post('/api/internal/auth/authenticate', {
      tenantId,
      email,
      password
    });
  }

  // User Management
  async createTenantUser(tenantId, userData) {
    return this.client.post(`/api/internal/tenants/${tenantId}/users`, userData);
  }

  // Bot Management
  async createBotInstance(tenantId, botData) {
    return this.client.post(`/api/internal/tenants/${tenantId}/bots`, botData);
  }

  async getTenantBots(tenantId) {
    return this.client.get(`/api/internal/tenants/${tenantId}/bots`);
  }

  async updateBotStatus(botId, status, sessionData = null) {
    return this.client.put(`/api/internal/bots/${botId}/status`, {
      status,
      sessionData
    });
  }

  // Analytics
  async recordAnalytic(tenantId, metric, value, metadata = {}) {
    return this.client.post(`/api/internal/tenants/${tenantId}/analytics`, {
      metric,
      value,
      metadata
    });
  }

  async getAnalytics(tenantId, metrics = [], startDate = null, endDate = null) {
    const params = new URLSearchParams();
    if (metrics.length > 0) {
      params.append('metrics', metrics.join(','));
    }
    if (startDate) {
      params.append('startDate', startDate.toISOString());
    }
    if (endDate) {
      params.append('endDate', endDate.toISOString());
    }

    return this.client.get(`/api/internal/tenants/${tenantId}/analytics?${params.toString()}`);
  }

  // Audit Logging
  async logAction(tenantId, userId, action, resource, resourceId, details = {}, ipAddress = 'unknown', userAgent = '') {
    return this.client.post(`/api/internal/tenants/${tenantId}/audit-logs`, {
      userId,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent
    });
  }

  // Plan Management
  async checkPlanLimits(tenantId, resource) {
    return this.client.get(`/api/internal/tenants/${tenantId}/plan-limits/${resource}`);
  }

  async getCurrentUsage(tenantId, resource) {
    return this.client.get(`/api/internal/tenants/${tenantId}/usage/${resource}`);
  }

  // API Key Management
  async createApiKey(tenantId, name) {
    return this.client.post(`/api/internal/tenants/${tenantId}/api-keys`, { name });
  }

  async validateApiKey(apiKey) {
    return this.client.post('/api/internal/validate-api-key', { apiKey });
  }

  // Stripe Service Methods
  async getAllPlans() {
    return this.client.get('/api/internal/stripe/plans');
  }

  async createCustomer(tenantId, customerData) {
    return this.client.post(`/api/internal/tenants/${tenantId}/stripe/customers`, customerData);
  }

  async getSubscriptionInfo(tenantId) {
    return this.client.get(`/api/internal/tenants/${tenantId}/subscription`);
  }

  async handleStripeWebhook(body, signature) {
    return this.client.post('/api/internal/stripe/webhook', body, {
      headers: {
        'stripe-signature': signature
      }
    });
  }
}

// Create singleton instance
const apiClient = new APIClient();

export default apiClient;
import apiClient from '../../lib/apiClient.js';

// API-based Stripe service for Next.js
export class MultiTenantStripeService {
  constructor() {
    this.apiClient = apiClient;
  }

  async getAllPlans() {
    try {
      const response = await this.apiClient.getAllPlans();
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async createCustomer(tenantId, customerData) {
    try {
      const response = await this.apiClient.createCustomer(tenantId, customerData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getSubscriptionInfo(tenantId) {
    try {
      const response = await this.apiClient.getSubscriptionInfo(tenantId);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async handleWebhook(body, signature) {
    try {
      const response = await this.apiClient.handleStripeWebhook(body, signature);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default new MultiTenantStripeService();
import axios from 'axios';

class APIClient {
  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Request interceptor for auth token
    this.client.interceptors.request.use(
      (config) => {
        // Get token from localStorage (managed by AuthContext)
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('auth_token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
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

        if (error.response?.status === 401) {
          // Handle unauthorized (e.g., redirect to login)
          if (typeof window !== 'undefined') {
            // Optional: Dispatch event or clear token
          }
        }

        const errorMessage = error.response?.data?.error || error.message || 'An error occurred';
        const apiError = new Error(errorMessage);
        apiError.status = error.response?.status;
        apiError.data = error.response?.data;

        return Promise.reject(apiError);
      }
    );
  }

  // Auth
  async register(userData) {
    return this.client.post('/auth/register', userData);
  }

  async login(credentials) {
    return this.client.post('/auth/login', credentials);
  }

  async getMe() {
    return this.client.get('/auth/me');
  }

  async checkAvailability(params) {
    const queryString = new URLSearchParams(params).toString();
    return this.client.get(`/auth/availability?${queryString}`);
  }

  // Bot Management (Internal Tenant Routes)
  async createBot(tenantId, botData) {
    return this.client.post(`/internal/tenants/${tenantId}/bots`, botData);
  }

  async getBots(tenantId) {
    return this.client.get(`/internal/tenants/${tenantId}/bots`);
  }

  async startBot(botId) {
    return this.client.post(`/bots/${botId}/start`);
  }

  async stopBot(botId) {
    return this.client.post(`/bots/${botId}/stop`);
  }

  async getBotQRCode(botId) {
    return this.client.get(`/bots/${botId}/qr`);
  }

  // Analytics
  async getAnalytics(tenantId) {
    return this.client.get(`/analytics/overview?tenantId=${tenantId}`);
  }
}

const apiClient = new APIClient();

export default apiClient;

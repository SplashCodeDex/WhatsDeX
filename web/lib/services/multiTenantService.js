// Simplified multi-tenant service for Next.js API routes
// This avoids complex imports and focuses on what's needed for the web app

export class MultiTenantService {
  constructor() {
    // Simple in-memory store for demo purposes
    this.demoTenant = {
      id: 'demo-tenant-1',
      name: 'Demo Company',
      subdomain: 'demo',
      email: 'admin@demo.com',
      plan: 'basic',
      status: 'active',
      planLimits: {
        maxBots: 3,
        maxUsers: 10,
        maxMessages: 5000,
        maxApiCalls: 1000
      }
    };

    this.demoUser = {
      id: 'demo-user-1',
      tenantId: 'demo-tenant-1',
      email: 'admin@demo.com',
      name: 'Demo Admin',
      role: 'admin',
      isActive: true
    };

    this.demoBots = [
      {
        id: 'demo-bot-1',
        tenantId: 'demo-tenant-1',
        name: 'Demo WhatsApp Bot',
        status: 'connected',
        phoneNumber: '+1234567890',
        lastActivity: new Date(),
        createdAt: new Date()
      }
    ];
  }

  async authenticateUser(tenantId, email, password) {
    // Simple demo authentication
    if (email === 'admin@demo.com' && password === 'password123') {
      const token = this.generateToken(this.demoUser, this.demoTenant);
      
      return {
        token,
        user: {
          id: this.demoUser.id,
          email: this.demoUser.email,
          name: this.demoUser.name,
          role: this.demoUser.role
        },
        tenant: {
          id: this.demoTenant.id,
          name: this.demoTenant.name,
          subdomain: this.demoTenant.subdomain,
          plan: this.demoTenant.plan
        }
      };
    }
    
    throw new Error('Invalid credentials');
  }

  async getTenant(identifier) {
    if (identifier === 'demo' || identifier === this.demoTenant.id) {
      return {
        ...this.demoTenant,
        tenantUsers: [this.demoUser],
        botInstances: this.demoBots,
        subscriptions: []
      };
    }
    return null;
  }

  async createTenant(data) {
    const { name, subdomain, email, adminUser } = data;
    
    // For demo purposes, create a simple tenant
    const newTenant = {
      id: `tenant-${Date.now()}`,
      name,
      subdomain,
      email,
      status: 'active',
      plan: 'free',
      planLimits: {
        maxBots: 1,
        maxUsers: 3,
        maxMessages: 100,
        maxApiCalls: 50
      }
    };

    const newUser = {
      id: `user-${Date.now()}`,
      tenantId: newTenant.id,
      email: adminUser.email,
      name: adminUser.name,
      role: 'admin',
      isActive: true
    };

    const newBot = {
      id: `bot-${Date.now()}`,
      tenantId: newTenant.id,
      name: `${name} Bot`,
      status: 'disconnected',
      createdAt: new Date()
    };

    return {
      tenant: newTenant,
      user: newUser,
      botInstance: newBot
    };
  }

  generateToken(user, tenant) {
    // Simple token generation for demo
    const payload = {
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
      tenantSubdomain: tenant.subdomain,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };
    
    // Simple base64 encoding for demo (not secure for production)
    return btoa(JSON.stringify(payload));
  }

  verifyToken(token) {
    try {
      const payload = JSON.parse(atob(token));
      if (payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token expired');
      }
      return payload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async getBots(tenantId) {
    if (tenantId === this.demoTenant.id) {
      return {
        bots: this.demoBots,
        limits: this.demoTenant.planLimits,
        plan: this.demoTenant.plan
      };
    }
    return { bots: [], limits: {}, plan: 'free' };
  }

  async createBot(tenantId, botData) {
    const newBot = {
      id: `bot-${Date.now()}`,
      tenantId,
      name: botData.name,
      status: 'disconnected',
      config: botData.config,
      createdAt: new Date()
    };

    if (tenantId === this.demoTenant.id) {
      this.demoBots.push(newBot);
    }

    return newBot;
  }

  async recordAnalytic(tenantId, event, value, metadata = {}) {
    // Simple analytics recording for demo
    console.log(`Analytics: ${tenantId} - ${event}: ${value}`, metadata);
    return { success: true, recorded: new Date() };
  }

  async logAction(tenantId, userId, action, resourceType, resourceId, metadata = {}, ipAddress = 'unknown', userAgent = '') {
    // Simple action logging for demo
    console.log(`Action Log: ${tenantId}/${userId} - ${action} on ${resourceType}:${resourceId}`, {
      metadata,
      ipAddress,
      userAgent,
      timestamp: new Date()
    });
    return { success: true, logged: new Date() };
  }
}

export default new MultiTenantService();
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

export class MultiTenantService {
  constructor() {
    this.prisma = prisma;
  }

  // Tenant Management
  async createTenant(data) {
    try {
      const { name, subdomain, email, adminUser } = data;

      // Check if subdomain is available
      const existingTenant = await this.prisma.tenant.findUnique({
        where: { subdomain }
      });

      if (existingTenant) {
        throw new Error('Subdomain already taken');
      }

      // Create tenant and admin user in transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Create tenant
        const tenant = await tx.tenant.create({
          data: {
            name,
            subdomain,
            email,
            status: 'active',
            plan: 'free',
            planLimits: JSON.stringify({
              maxBots: 1,
              maxUsers: 5,
              maxMessages: 1000,
              maxApiCalls: 100
            })
          }
        });

        // Create admin user
        const passwordHash = await bcrypt.hash(adminUser.password, 12);
        const user = await tx.tenantUser.create({
          data: {
            tenantId: tenant.id,
            email: adminUser.email,
            name: adminUser.name,
            passwordHash,
            role: 'admin',
            isActive: true,
            emailVerified: true
          }
        });

        // Create default bot instance
        const botInstance = await tx.botInstance.create({
          data: {
            tenantId: tenant.id,
            name: `${name} Bot`,
            status: 'disconnected',
            config: JSON.stringify({
              welcomeMessage: `Welcome to ${name}! How can I help you today?`,
              defaultLanguage: 'en',
              aiEnabled: true
            })
          }
        });

        return { tenant, user, botInstance };
      });

      logger.info(`Created new tenant: ${subdomain}`, { tenantId: result.tenant.id });
      return result;
    } catch (error) {
      logger.error('Failed to create tenant', { error: error.message });
      throw error;
    }
  }

  async getTenant(identifier) {
    try {
      const tenant = await this.prisma.tenant.findFirst({
        where: {
          OR: [
            { subdomain: identifier },
            { id: identifier },
            { email: identifier }
          ]
        },
        include: {
          tenantUsers: {
            where: { isActive: true },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              lastLoginAt: true
            }
          },
          botInstances: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              phoneNumber: true,
              status: true,
              lastActivity: true
            }
          },
          subscriptions: {
            where: { status: 'active' },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });

      return tenant;
    } catch (error) {
      logger.error('Failed to get tenant', { error: error.message });
      throw error;
    }
  }

  async updateTenant(tenantId, data) {
    try {
      const tenant = await this.prisma.tenant.update({
        where: { id: tenantId },
        data
      });

      logger.info(`Updated tenant: ${tenantId}`);
      return tenant;
    } catch (error) {
      logger.error('Failed to update tenant', { error: error.message });
      throw error;
    }
  }

  // User Management
  async createTenantUser(tenantId, userData) {
    try {
      const { email, name, password, role = 'user', invitedBy } = userData;

      // Check if user already exists
      const existingUser = await this.prisma.tenantUser.findUnique({
        where: { tenantId_email: { tenantId, email } }
      });

      if (existingUser) {
        throw new Error('User already exists');
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const user = await this.prisma.tenantUser.create({
        data: {
          tenantId,
          email,
          name,
          passwordHash,
          role,
          invitedBy,
          invitedAt: new Date(),
          isActive: true
        }
      });

      logger.info(`Created tenant user: ${email}`, { tenantId, userId: user.id });
      return user;
    } catch (error) {
      logger.error('Failed to create tenant user', { error: error.message });
      throw error;
    }
  }

  async authenticateUser(tenantId, email, password) {
    try {
      const user = await this.prisma.tenantUser.findUnique({
        where: { tenantId_email: { tenantId, email } },
        include: { tenant: true }
      });

      if (!user || !user.isActive) {
        throw new Error('Invalid credentials');
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // Update last login
      await this.prisma.tenantUser.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      // Generate JWT token
      const token = jwt.sign({
        userId: user.id,
        tenantId: user.tenantId,
        email: user.email,
        role: user.role,
        tenantSubdomain: user.tenant.subdomain
      }, JWT_SECRET, { expiresIn: '24h' });

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        tenant: {
          id: user.tenant.id,
          name: user.tenant.name,
          subdomain: user.tenant.subdomain,
          plan: user.tenant.plan
        }
      };
    } catch (error) {
      logger.error('Authentication failed', { error: error.message });
      throw error;
    }
  }

  // Bot Instance Management
  async createBotInstance(tenantId, botData) {
    try {
      const { name, phoneNumber, config } = botData;

      const botInstance = await this.prisma.botInstance.create({
        data: {
          tenantId,
          name,
          phoneNumber,
          config: JSON.stringify(config),
          status: 'disconnected'
        }
      });

      logger.info(`Created bot instance: ${name}`, { tenantId, botId: botInstance.id });
      return botInstance;
    } catch (error) {
      logger.error('Failed to create bot instance', { error: error.message });
      throw error;
    }
  }

  async updateBotStatus(botInstanceId, status, sessionData = null) {
    try {
      const updateData = {
        status,
        lastActivity: new Date()
      };

      if (sessionData) {
        updateData.sessionData = sessionData;
      }

      const botInstance = await this.prisma.botInstance.update({
        where: { id: botInstanceId },
        data: updateData
      });

      return botInstance;
    } catch (error) {
      logger.error('Failed to update bot status', { error: error.message });
      throw error;
    }
  }

  // API Key Management
  async createApiKey(tenantId, name) {
    try {
      const key = crypto.randomBytes(32).toString('hex');
      const keyPrefix = key.substring(0, 8);
      const keyHash = crypto.createHash('sha256').update(key).digest('hex');

      const apiKey = await this.prisma.tenantApiKey.create({
        data: {
          tenantId,
          name,
          keyHash,
          keyPrefix,
          isActive: true
        }
      });

      return {
        ...apiKey,
        key: `wdx_${key}` // Return the actual key only once
      };
    } catch (error) {
      logger.error('Failed to create API key', { error: error.message });
      throw error;
    }
  }

  async validateApiKey(apiKey) {
    try {
      if (!apiKey.startsWith('wdx_')) {
        throw new Error('Invalid API key format');
      }

      const key = apiKey.substring(4);
      const keyHash = crypto.createHash('sha256').update(key).digest('hex');

      const storedKey = await this.prisma.tenantApiKey.findUnique({
        where: { keyHash },
        include: { tenant: true }
      });

      if (!storedKey || !storedKey.isActive) {
        throw new Error('Invalid or inactive API key');
      }

      // Update last used
      await this.prisma.tenantApiKey.update({
        where: { id: storedKey.id },
        data: { lastUsed: new Date() }
      });

      return storedKey;
    } catch (error) {
      logger.error('API key validation failed', { error: error.message });
      throw error;
    }
  }

  // Analytics
  async recordAnalytic(tenantId, metric, value, metadata = null) {
    try {
      await this.prisma.tenantAnalytics.create({
        data: {
          tenantId,
          metric,
          value,
          metadata: metadata ? JSON.stringify(metadata) : null
        }
      });
    } catch (error) {
      logger.error('Failed to record analytics', { error: error.message });
    }
  }

  async getAnalytics(tenantId, metrics, startDate, endDate) {
    try {
      const analytics = await this.prisma.tenantAnalytics.findMany({
        where: {
          tenantId,
          metric: { in: metrics },
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { date: 'asc' }
      });

      return analytics;
    } catch (error) {
      logger.error('Failed to get analytics', { error: error.message });
      throw error;
    }
  }

  // Audit Logging
  async logAction(tenantId, userId, action, resource, resourceId, details, ipAddress, userAgent) {
    try {
      await this.prisma.tenantAuditLog.create({
        data: {
          tenantId,
          userId,
          action,
          resource,
          resourceId,
          details: details ? JSON.stringify(details) : null,
          ipAddress,
          userAgent
        }
      });
    } catch (error) {
      logger.error('Failed to log action', { error: error.message });
    }
  }

  // Plan Limits
  async checkPlanLimits(tenantId, resource) {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId }
      });

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      const limits = JSON.parse(tenant.planLimits || '{}');
      const current = await this.getCurrentUsage(tenantId, resource);

      return {
        limit: limits[resource] || 0,
        current,
        remaining: Math.max(0, (limits[resource] || 0) - current),
        canProceed: current < (limits[resource] || 0)
      };
    } catch (error) {
      logger.error('Failed to check plan limits', { error: error.message });
      throw error;
    }
  }

  async getCurrentUsage(tenantId, resource) {
    try {
      switch (resource) {
        case 'maxBots':
          return await this.prisma.botInstance.count({
            where: { tenantId, isActive: true }
          });
        case 'maxUsers':
          return await this.prisma.tenantUser.count({
            where: { tenantId, isActive: true }
          });
        case 'maxMessages':
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return await this.prisma.botMessage.count({
            where: {
              botInstance: { tenantId },
              timestamp: { gte: thirtyDaysAgo }
            }
          });
        default:
          return 0;
      }
    } catch (error) {
      logger.error('Failed to get current usage', { error: error.message });
      return 0;
    }
  }
}

export default new MultiTenantService();
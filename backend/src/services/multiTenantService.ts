import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import logger from '../utils/logger';
import databaseService from './database';
import { admin } from '../lib/firebase';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const SALT_ROUNDS = 10;

export class MultiTenantService {
  // Tenant Management
  async createTenant(data: { name: string; email: string; plan?: string }) {
    const tenantId = `tenant_${crypto.randomUUID()}`;
    const tenantData = {
      id: tenantId,
      name: data.name,
      email: data.email,
      plan: data.plan || 'free',
      createdAt: new Date(),
    };
    await admin.firestore().collection('tenants').doc(tenantId).set(tenantData);
    logger.info('Tenant created successfully', { tenantId });
    return tenantData;
  }

  async getTenant(tenantId: string) {
    const doc = await admin.firestore().collection('tenants').doc(tenantId).get();
    if (!doc.exists) {
      logger.warn('Tenant not found', { tenantId });
      return null;
    }
    return doc.data();
  }

  async updateTenant(tenantId: string, data: any) {
    await admin.firestore().collection('tenants').doc(tenantId).update(data);
    logger.info('Tenant updated successfully', { tenantId });
    return { id: tenantId, ...data };
  }

  async listTenants() {
    const snapshot = await admin.firestore().collection('tenants').get();
    return snapshot.docs.map(doc => doc.data());
  }

  // User Management
  async createTenantUser(tenantId: string, userData: any) {
    const userId = `user_${crypto.randomUUID()}`;
    const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);
    const userRecord = {
      id: userId,
      tenantId,
      email: userData.email,
      password: hashedPassword,
      role: userData.role || 'user',
      createdAt: new Date(),
    };
    await databaseService.setDoc(tenantId, 'users', userId, userRecord);
    logger.info('Tenant user created', { tenantId, userId });
    return userRecord;
  }

  async authenticateUser(tenantId: string, email: string, password: string): Promise<any> {
    const user = await this.findUserByEmail(tenantId, email);

    if (user && await bcrypt.compare(password, user.password)) {
      const tenant = await this.getTenant(tenantId);
      const token = jwt.sign({ userId: user.id, tenantId, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
      return {
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        tenant,
      };
    }
    logger.warn('Authentication failed', { tenantId, email });
    return null;
  }

  private async findUserByEmail(tenantId: string, email: string): Promise<any> {
    const usersCollection = admin.firestore().collection(`tenants/${tenantId}/users`);
    const snapshot = await usersCollection.where('email', '==', email).limit(1).get();
    if (snapshot.empty) {
      return null;
    }
    return snapshot.docs[0].data();
  }

  // Analytics
  async recordAnalytic(tenantId: string, metric: string, value: number, metadata: any = {}) {
    await databaseService.setDoc(tenantId, 'analytics', `${metric}_${Date.now()}`, {
      metric,
      value,
      metadata,
      timestamp: new Date(),
    });
  }

  // A real implementation would involve more complex queries, possibly to a dedicated analytics service.
  async getAnalytics(tenantId: string) {
    const snapshot = await admin.firestore().collection(`tenants/${tenantId}/analytics`).get();
    return snapshot.docs.map(doc => doc.data());
  }

  // Plan Limits
  async checkPlanLimits(tenantId: string, resource: 'maxBots' | 'messagesPerMonth') {
    const tenant = await this.getTenant(tenantId);
    const plan = tenant?.plan || 'free';
    const limits = {
      free: { maxBots: 1, messagesPerMonth: 1000 },
      pro: { maxBots: 10, messagesPerMonth: 50000 },
    };

    const limit = limits[plan][resource];
    const currentUsage = await this.getCurrentUsage(tenantId, resource);

    return {
      limit,
      current: currentUsage,
      remaining: limit - currentUsage,
      canProceed: currentUsage < limit,
    };
  }

  async getCurrentUsage(tenantId: string, resource: 'maxBots' | 'messagesPerMonth') {
    if (resource === 'maxBots') {
      const snapshot = await admin.firestore().collection(`tenants/${tenantId}/bots`).get();
      return snapshot.size;
    }
    if (resource === 'messagesPerMonth') {
      // This is a simplified example. A real implementation would query analytics data.
      return 0;
    }
    return 0;
  }
}

export default new MultiTenantService();

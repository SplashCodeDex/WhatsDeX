/**
 * Singleton Database Manager with Connection Pooling
 * Fixes multiple Prisma instances issue
 */

import { PrismaClient } from '@prisma/client';

class DatabaseManager {
  constructor() {
    if (DatabaseManager.instance) {
      return DatabaseManager.instance;
    }

    this.prisma = null;
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxRetries = 5;
    
    DatabaseManager.instance = this;
  }

  async initialize() {
    if (this.prisma && this.isConnected) {
      return this.prisma;
    }

    try {
      this.prisma = new PrismaClient({
        log: ['error', 'warn'],
        errorFormat: 'pretty',
        datasources: {
          db: {
            url: process.env.DATABASE_URL
          }
        }
      });

      // Test connection
      await this.prisma.$connect();
      this.isConnected = true;
      this.connectionAttempts = 0;
      
      console.log('✅ Database connected successfully');
      
      // Set up cleanup handlers
      this.setupCleanupHandlers();
      
      return this.prisma;
    } catch (error) {
      this.connectionAttempts++;
      console.error(`❌ Database connection failed (attempt ${this.connectionAttempts}):`, error.message);
      
      if (this.connectionAttempts < this.maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, this.connectionAttempts), 30000);
        console.log(`⏳ Retrying in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.initialize();
      } else {
        throw new Error(`Database connection failed after ${this.maxRetries} attempts`);
      }
    }
  }

  setupCleanupHandlers() {
    // Graceful shutdown
    const cleanup = async () => {
      console.log('🔄 Closing database connections...');
      if (this.prisma) {
        await this.prisma.$disconnect();
        this.isConnected = false;
      }
      console.log('✅ Database disconnected gracefully');
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('beforeExit', cleanup);
  }

  async getClient() {
    if (!this.prisma || !this.isConnected) {
      await this.initialize();
    }
    return this.prisma;
  }

  async healthCheck() {
    try {
      const client = await this.getClient();
      await client.$queryRaw`SELECT 1`;
      return { status: 'healthy', connected: true };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        connected: false, 
        error: error.message 
      };
    }
  }

  // Transaction wrapper
  async transaction(callback) {
    const client = await this.getClient();
    return client.$transaction(callback);
  }

  // Batch operations
  async batchExecute(operations) {
    const client = await this.getClient();
    return client.$transaction(operations);
  }
}

// Export singleton instance
const dbManager = new DatabaseManager();
export default dbManager;
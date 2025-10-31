import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import redis from 'redis';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const health = {
      timestamp: new Date().toISOString(),
      services: {}
    };

    // Database health check
    try {
      await prisma.$queryRaw`SELECT 1`;
      health.services.database = 'healthy';
    } catch (error) {
      health.services.database = 'unhealthy';
      health.services.database_error = error.message;
    }

    // Redis health check
    try {
      const redisClient = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        password: process.env.REDIS_PASSWORD
      });

      await redisClient.connect();
      await redisClient.ping();
      await redisClient.quit();
      health.services.redis = 'healthy';
    } catch (error) {
      health.services.redis = 'unhealthy';
      health.services.redis_error = error.message;
    }

    // WhatsApp connection check (mock - would need actual connection status)
    health.services.whatsapp = 'connected'; // This would come from actual bot status

    // Gemini AI service check
    try {
      const response = await fetch('http://localhost:3001/health/gemini', {
        timeout: 5000
      });
      if (response.ok) {
        health.services.gemini = 'healthy';
      } else {
        health.services.gemini = 'unhealthy';
      }
    } catch (error) {
      health.services.gemini = 'unhealthy';
      health.services.gemini_error = error.message;
    }

    // System metrics
    health.system = {
      memoryUsage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      cpuUsage: 'N/A', // Would need additional monitoring
      uptime: Math.floor(process.uptime()),
      nodeVersion: process.version
    };

    // Overall status
    const allHealthy = Object.values(health.services).every(status => status === 'healthy');
    health.status = allHealthy ? 'healthy' : 'degraded';

    return NextResponse.json(health);
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
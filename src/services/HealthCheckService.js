/**
 * Comprehensive Health Check & Monitoring Service
 * Provides health endpoints and system monitoring
 */

import os from 'os';
import { performance } from 'perf_hooks';
import dbManager from '../utils/DatabaseManager.js';
import { RateLimiter } from '../utils/RateLimiter.js';
import logger from '../utils/Logger.js';

export class HealthCheckService {
  constructor() {
    this.startTime = Date.now();
    this.healthChecks = new Map();
    this.metrics = new Map();
    this.rateLimiter = new RateLimiter();
    
    this.registerDefaultChecks();
    this.startPeriodicChecks();
  }

  registerDefaultChecks() {
    // Database health check
    this.registerHealthCheck('database', async () => {
      const start = performance.now();
      try {
        const health = await dbManager.healthCheck();
        const duration = performance.now() - start;
        
        return {
          status: health.connected ? 'healthy' : 'unhealthy',
          details: health,
          responseTime: Math.round(duration),
          critical: true
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          error: error.message,
          critical: true
        };
      }
    });

    // Redis health check
    this.registerHealthCheck('redis', async () => {
      const start = performance.now();
      try {
        await this.rateLimiter.redis.ping();
        const duration = performance.now() - start;
        
        return {
          status: 'healthy',
          responseTime: Math.round(duration),
          critical: true
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          error: error.message,
          critical: true
        };
      }
    });

    // Memory health check
    this.registerHealthCheck('memory', async () => {
      const usage = process.memoryUsage();
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      
      const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
      const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
      const rssMB = Math.round(usage.rss / 1024 / 1024);
      const systemUsedMB = Math.round(usedMem / 1024 / 1024);
      const systemTotalMB = Math.round(totalMem / 1024 / 1024);
      
      const heapUsage = (usage.heapUsed / usage.heapTotal) * 100;
      const systemUsage = (usedMem / totalMem) * 100;
      
      // Alert if memory usage is high
      const status = heapUsage > 85 || systemUsage > 90 ? 'warning' : 'healthy';
      
      return {
        status,
        heap: {
          used: heapUsedMB,
          total: heapTotalMB,
          usage: Math.round(heapUsage)
        },
        system: {
          used: systemUsedMB,
          total: systemTotalMB,
          usage: Math.round(systemUsage)
        },
        rss: rssMB
      };
    });

    // CPU health check
    this.registerHealthCheck('cpu', async () => {
      const cpus = os.cpus();
      const load = os.loadavg();
      
      return {
        status: load[0] > cpus.length * 0.8 ? 'warning' : 'healthy',
        cores: cpus.length,
        load: {
          '1min': Math.round(load[0] * 100) / 100,
          '5min': Math.round(load[1] * 100) / 100,
          '15min': Math.round(load[2] * 100) / 100
        },
        usage: Math.round((load[0] / cpus.length) * 100)
      };
    });

    // Disk space check
    this.registerHealthCheck('disk', async () => {
      try {
        const stats = await import('fs/promises').then(fs => 
          fs.stat('.')
        );
        
        return {
          status: 'healthy',
          details: 'Disk accessible'
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          error: error.message
        };
      }
    });
  }

  registerHealthCheck(name, checkFunction) {
    this.healthChecks.set(name, checkFunction);
    logger.debug(`Health check registered: ${name}`);
  }

  async runHealthCheck(name) {
    const checkFunction = this.healthChecks.get(name);
    if (!checkFunction) {
      throw new Error(`Health check '${name}' not found`);
    }

    const start = performance.now();
    try {
      const result = await Promise.race([
        checkFunction(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), 5000)
        )
      ]);

      const duration = performance.now() - start;
      return {
        ...result,
        duration: Math.round(duration),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      const duration = performance.now() - start;
      return {
        status: 'unhealthy',
        error: error.message,
        duration: Math.round(duration),
        timestamp: new Date().toISOString()
      };
    }
  }

  async runAllHealthChecks() {
    const results = {};
    const promises = [];

    for (const [name] of this.healthChecks) {
      promises.push(
        this.runHealthCheck(name).then(result => {
          results[name] = result;
        })
      );
    }

    await Promise.allSettled(promises);
    
    // Determine overall status
    const criticalChecks = Object.entries(results)
      .filter(([_, result]) => result.critical);
    
    const hasUnhealthyCritical = criticalChecks.some(([_, result]) => 
      result.status === 'unhealthy'
    );
    
    const hasWarnings = Object.values(results).some(result => 
      result.status === 'warning'
    );

    let overallStatus = 'healthy';
    if (hasUnhealthyCritical) {
      overallStatus = 'unhealthy';
    } else if (hasWarnings) {
      overallStatus = 'warning';
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: this.getUptime(),
      checks: results
    };
  }

  async getSystemInfo() {
    const uptime = this.getUptime();
    const memoryUsage = process.memoryUsage();
    
    return {
      service: 'WhatsDeX Bot',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      platform: os.platform(),
      arch: os.arch(),
      uptime,
      startTime: new Date(this.startTime).toISOString(),
      pid: process.pid,
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024)
      },
      system: {
        totalMemory: Math.round(os.totalmem() / 1024 / 1024),
        freeMemory: Math.round(os.freemem() / 1024 / 1024),
        cpuCount: os.cpus().length,
        loadAverage: os.loadavg()
      }
    };
  }

  getUptime() {
    const uptimeMs = Date.now() - this.startTime;
    const days = Math.floor(uptimeMs / (24 * 60 * 60 * 1000));
    const hours = Math.floor((uptimeMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((uptimeMs % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((uptimeMs % (60 * 1000)) / 1000);

    return {
      ms: uptimeMs,
      human: `${days}d ${hours}h ${minutes}m ${seconds}s`
    };
  }

  recordMetric(name, value, tags = {}) {
    const metric = {
      name,
      value,
      tags,
      timestamp: Date.now()
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metrics = this.metrics.get(name);
    metrics.push(metric);

    // Keep only last 1000 metrics per name
    if (metrics.length > 1000) {
      metrics.shift();
    }

    logger.logMetric(name, value, 'count', tags);
  }

  getMetrics(name = null) {
    if (name) {
      return this.metrics.get(name) || [];
    }
    
    const allMetrics = {};
    for (const [metricName, values] of this.metrics) {
      allMetrics[metricName] = values;
    }
    
    return allMetrics;
  }

  startPeriodicChecks() {
    // Run health checks every 30 seconds
    setInterval(async () => {
      try {
        const results = await this.runAllHealthChecks();
        
        // Log critical failures
        if (results.status === 'unhealthy') {
          logger.error('System health check failed', results);
        } else if (results.status === 'warning') {
          logger.warn('System health warning', results);
        }

        // Record memory usage metric
        logger.logMemoryUsage();
        
      } catch (error) {
        logger.error('Periodic health check failed', { error: error.message });
      }
    }, 30000);

    // Log system metrics every 5 minutes
    setInterval(() => {
      this.recordMetric('uptime', Date.now() - this.startTime);
      this.recordMetric('memory_usage', process.memoryUsage().heapUsed);
      this.recordMetric('cpu_usage', os.loadavg()[0]);
    }, 300000);
  }

  // Express middleware for health endpoints
  createHealthEndpoints(app) {
    // Liveness probe - basic health check
    app.get('/health', async (req, res) => {
      try {
        res.json({
          status: 'ok',
          timestamp: new Date().toISOString(),
          uptime: this.getUptime().human
        });
      } catch (error) {
        res.status(500).json({
          status: 'error',
          error: error.message
        });
      }
    });

    // Readiness probe - comprehensive health checks
    app.get('/health/ready', async (req, res) => {
      try {
        const health = await this.runAllHealthChecks();
        const statusCode = health.status === 'healthy' ? 200 : 
                          health.status === 'warning' ? 200 : 503;
        
        res.status(statusCode).json(health);
      } catch (error) {
        res.status(500).json({
          status: 'error',
          error: error.message
        });
      }
    });

    // System information endpoint
    app.get('/health/info', async (req, res) => {
      try {
        const info = await this.getSystemInfo();
        res.json(info);
      } catch (error) {
        res.status(500).json({
          status: 'error',
          error: error.message
        });
      }
    });

    // Metrics endpoint
    app.get('/health/metrics', (req, res) => {
      try {
        const metrics = this.getMetrics();
        res.json(metrics);
      } catch (error) {
        res.status(500).json({
          status: 'error',
          error: error.message
        });
      }
    });
  }

  // Graceful shutdown handler
  async gracefulShutdown() {
    logger.info('Starting graceful shutdown...');
    
    try {
      // Close database connections
      if (dbManager) {
        await dbManager.getClient().then(client => client.$disconnect());
      }

      // Close Redis connections
      if (this.rateLimiter?.redis) {
        await this.rateLimiter.disconnect();
      }

      logger.info('Graceful shutdown completed');
    } catch (error) {
      logger.error('Error during graceful shutdown', { error: error.message });
    }
  }
}
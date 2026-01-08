import { performance } from 'perf_hooks';
import { logger } from '../utils/logger';

class PerformanceMonitor {
  constructor() {
    this.eventLoopLag = 0;
    this.gcStats = { collections: 0, pauseTime: 0 };
    this.memoryStats = {};
    this.cpuUsage = process.cpuUsage();
    this.startTime = Date.now();

    this.startMonitoring();
    logger.info('Performance monitor initialized');
  }

  startMonitoring() {
    // Event loop lag monitoring
    let lastCheck = Date.now();

    setInterval(() => {
      const now = Date.now();
      const lag = now - lastCheck - 100; // Expected 100ms interval
      this.eventLoopLag = lag;

      // Alert if lag > 50ms
      if (lag > 50) {
        logger.warn('⚠️ Event loop lag detected', {
          lag: `${lag}ms`,
          threshold: '50ms',
        });
      }

      lastCheck = now;
    }, 100);

    // Memory monitoring
    setInterval(() => {
      const memUsage = process.memoryUsage();
      this.memoryStats = {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        rss: Math.round(memUsage.rss / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
        arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024),
      };

      // Alert if memory usage > 80% of heap total
      const memoryUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      if (memoryUsagePercent > 80) {
        logger.warn('⚠️ High memory usage detected', {
          usagePercent: `${memoryUsagePercent.toFixed(1)}%`,
          heapUsed: `${this.memoryStats.heapUsed}MB`,
          heapTotal: `${this.memoryStats.heapTotal}MB`,
        });
      }
    }, 5000); // Every 5 seconds

    // CPU monitoring
    setInterval(() => {
      const currentCpuUsage = process.cpuUsage(this.cpuUsage);
      const userPercent = (currentCpuUsage.user / 1000000) * 100; // Convert to percentage
      const systemPercent = (currentCpuUsage.system / 1000000) * 100;

      if (userPercent + systemPercent > 70) {
        logger.warn('⚠️ High CPU usage detected', {
          userPercent: `${userPercent.toFixed(1)}%`,
          systemPercent: `${systemPercent.toFixed(1)}%`,
          totalPercent: `${(userPercent + systemPercent).toFixed(1)}%`,
        });
      }

      this.cpuUsage = process.cpuUsage();
    }, 10000); // Every 10 seconds
  }

  getMetrics() {
    const uptime = Date.now() - this.startTime;

    return {
      eventLoopLag: this.eventLoopLag,
      memoryUsage: this.memoryStats,
      uptime: Math.round(uptime / 1000), // seconds
      timestamp: new Date().toISOString(),
      processInfo: {
        pid: process.pid,
        platform: process.platform,
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development',
      },
    };
  }

  // Method to force garbage collection (if --expose-gc flag is used)
  forceGC() {
    if (global.gc) {
      const startTime = performance.now();
      global.gc();
      const endTime = performance.now();

      logger.info('Manual garbage collection completed', {
        duration: `${(endTime - startTime).toFixed(2)}ms`,
      });

      return {
        duration: endTime - startTime,
        memoryBefore: this.memoryStats,
        memoryAfter: process.memoryUsage(),
      };
    } else {
      logger.warn('Manual GC not available. Run with --expose-gc flag');
      return null;
    }
  }

  // Health check method
  getHealthStatus() {
    const metrics = this.getMetrics();
    const isHealthy = metrics.eventLoopLag < 100 && metrics.memoryUsage.heapUsed < 200; // MB

    return {
      status: isHealthy ? 'healthy' : 'degraded',
      metrics,
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export default new PerformanceMonitor();

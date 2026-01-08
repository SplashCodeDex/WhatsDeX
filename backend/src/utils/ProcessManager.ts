/**
 * Process Manager for Graceful Shutdown & Signal Handling
 * Fixes the lack of graceful shutdown handling
 */

import { EventEmitter } from 'events';
import logger from './Logger';

export class ProcessManager extends EventEmitter {
  constructor() {
    super();
    this.isShuttingDown = false;
    this.shutdownTimeout = 30000; // 30 seconds
    this.services = new Map();
    this.shutdownHandlers = [];
    
    this.setupSignalHandlers();
  }

  setupSignalHandlers() {
    // Graceful shutdown signals
    process.on('SIGTERM', () => {
      logger.info('Received SIGTERM, starting graceful shutdown...');
      this.gracefulShutdown('SIGTERM');
    });

    process.on('SIGINT', () => {
      logger.info('Received SIGINT (Ctrl+C), starting graceful shutdown...');
      this.gracefulShutdown('SIGINT');
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', {
        error: error.message,
        stack: error.stack,
        type: 'uncaught_exception'
      });
      
      // Give logger time to flush, then exit
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Promise Rejection', {
        reason: reason instanceof Error ? reason.message : reason,
        stack: reason instanceof Error ? reason.stack : undefined,
        promise: promise.toString(),
        type: 'unhandled_rejection'
      });
    });

    // Handle warnings
    process.on('warning', (warning) => {
      logger.warn('Process Warning', {
        name: warning.name,
        message: warning.message,
        stack: warning.stack,
        type: 'process_warning'
      });
    });

    // Log process events
    process.on('exit', (code) => {
      logger.info('Process exiting', { exitCode: code });
    });

    process.on('beforeExit', (code) => {
      logger.info('Process before exit', { exitCode: code });
    });
  }

  // Register a service for graceful shutdown
  registerService(name, service, priority = 0) {
    this.services.set(name, {
      service,
      priority,
      shutdown: service.shutdown || service.close || service.disconnect
    });
    
    logger.debug(`Service registered for shutdown: ${name}`, { priority });
  }

  // Register custom shutdown handler
  onShutdown(handler, priority = 0) {
    this.shutdownHandlers.push({ handler, priority });
    this.shutdownHandlers.sort((a, b) => b.priority - a.priority);
  }

  async gracefulShutdown(signal) {
    if (this.isShuttingDown) {
      logger.warn('Shutdown already in progress, forcing exit...');
      process.exit(1);
    }

    this.isShuttingDown = true;
    const startTime = Date.now();

    logger.info('Starting graceful shutdown sequence', { 
      signal,
      registeredServices: Array.from(this.services.keys()),
      customHandlers: this.shutdownHandlers.length
    });

    // Set a timeout to force exit if shutdown takes too long
    const forceExitTimer = setTimeout(() => {
      logger.error('Graceful shutdown timeout exceeded, forcing exit');
      process.exit(1);
    }, this.shutdownTimeout);

    try {
      // Emit shutdown event
      this.emit('shutdown:start', { signal });

      // Stop accepting new connections/requests
      await this.stopAcceptingNewRequests();

      // Execute custom shutdown handlers (in priority order)
      await this.executeShutdownHandlers();

      // Shutdown registered services (in reverse priority order)
      await this.shutdownServices();

      // Final cleanup
      await this.finalCleanup();

      const duration = Date.now() - startTime;
      logger.info('Graceful shutdown completed successfully', { 
        duration: `${duration}ms`,
        signal 
      });

      clearTimeout(forceExitTimer);
      this.emit('shutdown:complete', { signal, duration });

      // Exit cleanly
      process.exit(0);

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Error during graceful shutdown', { 
        error: error.message,
        stack: error.stack,
        duration: `${duration}ms`,
        signal
      });

      clearTimeout(forceExitTimer);
      this.emit('shutdown:error', { error, signal, duration });

      // Force exit on error
      process.exit(1);
    }
  }

  async stopAcceptingNewRequests() {
    logger.info('Stopping acceptance of new requests...');
    
    // If Express server is registered
    const serverService = this.services.get('server');
    if (serverService?.service?.close) {
      await new Promise((resolve, reject) => {
        serverService.service.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
      logger.info('HTTP server closed');
    }
  }

  async executeShutdownHandlers() {
    logger.info('Executing custom shutdown handlers...');
    
    for (const { handler, priority } of this.shutdownHandlers) {
      try {
        logger.debug(`Executing shutdown handler (priority: ${priority})`);
        await Promise.race([
          handler(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Handler timeout')), 10000)
          )
        ]);
      } catch (error) {
        logger.warn('Shutdown handler failed', { 
          error: error.message,
          priority 
        });
      }
    }
  }

  async shutdownServices() {
    logger.info('Shutting down registered services...');
    
    // Sort services by priority (highest first)
    const sortedServices = Array.from(this.services.entries())
      .sort((a, b) => b[1].priority - a[1].priority);

    for (const [name, { service, shutdown }] of sortedServices) {
      try {
        logger.debug(`Shutting down service: ${name}`);
        
        if (typeof shutdown === 'function') {
          await Promise.race([
            shutdown.call(service),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Service shutdown timeout')), 15000)
            )
          ]);
          logger.info(`Service ${name} shut down successfully`);
        } else {
          logger.warn(`Service ${name} has no shutdown method`);
        }
      } catch (error) {
        logger.error(`Failed to shutdown service ${name}`, { 
          error: error.message 
        });
      }
    }
  }

  async finalCleanup() {
    logger.info('Performing final cleanup...');
    
    try {
      // Clear timers and intervals
      this.clearAllTimers();
      
      // Flush logs
      await new Promise(resolve => setTimeout(resolve, 100));
      
      logger.info('Final cleanup completed');
    } catch (error) {
      logger.error('Error in final cleanup', { error: error.message });
    }
  }

  clearAllTimers() {
    // This is a simple approach - in production, you'd want to track timers
    const highestTimeoutId = setTimeout(() => {}, 0);
    for (let i = 0; i <= highestTimeoutId; i++) {
      clearTimeout(i);
    }

    const highestIntervalId = setInterval(() => {}, Number.MAX_SAFE_INTEGER);
    for (let i = 0; i <= highestIntervalId; i++) {
      clearInterval(i);
    }
  }

  // Health check for process status
  getProcessHealth() {
    return {
      isShuttingDown: this.isShuttingDown,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform
    };
  }

  // Get registered services info
  getServicesInfo() {
    const services = {};
    for (const [name, { priority }] of this.services) {
      services[name] = { priority };
    }
    return services;
  }

  // Force shutdown (emergency use only)
  forceShutdown(exitCode = 1) {
    logger.error('Force shutdown initiated');
    process.exit(exitCode);
  }
}

// Export singleton instance
const processManager = new ProcessManager();
export default processManager;

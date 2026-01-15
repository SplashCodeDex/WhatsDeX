/**
 * Process Manager for Graceful Shutdown & Signal Handling
 */

import { EventEmitter } from 'events';
import logger from './logger.js';

interface ShutdownHandler {
  handler: () => Promise<void> | void;
  priority: number;
}

interface RegisteredService {
  service: any;
  priority: number;
  shutdown: () => Promise<void> | void;
}

export class ProcessManager extends EventEmitter {
  private isShuttingDown: boolean;
  private shutdownTimeout: number;
  private services: Map<string, RegisteredService>;
  private shutdownHandlers: ShutdownHandler[];

  constructor() {
    super();
    this.isShuttingDown = false;
    this.shutdownTimeout = 30000; // 30 seconds
    this.services = new Map();
    this.shutdownHandlers = [];

    this.setupSignalHandlers();
  }

  private setupSignalHandlers(): void {
    process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));

    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception', { message: error.message, stack: error.stack });
      setTimeout(() => process.exit(1), 1000);
    });

    process.on('unhandledRejection', (reason: unknown) => {
      logger.error('Unhandled Promise Rejection', { reason });
    });
  }

  public registerService(name: string, service: any, priority = 0): void {
    const shutdown = service.shutdown || service.close || service.disconnect;
    if (typeof shutdown === 'function') {
      this.services.set(name, {
        service,
        priority,
        shutdown: shutdown.bind(service)
      });
      logger.debug(`Service registered for shutdown: ${name}`, { priority });
    }
  }

  public onShutdown(handler: () => Promise<void> | void, priority = 0): void {
    this.shutdownHandlers.push({ handler, priority });
    this.shutdownHandlers.sort((a, b) => b.priority - a.priority);
  }

  async gracefulShutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) {
      logger.warn('Shutdown already in progress, forcing exit...');
      process.exit(1);
    }

    this.isShuttingDown = true;
    const startTime = Date.now();

    logger.info('Starting graceful shutdown sequence', { signal });

    const forceExitTimer = setTimeout(() => {
      logger.error('Graceful shutdown timeout exceeded, forcing exit');
      process.exit(1);
    }, this.shutdownTimeout);

    try {
      this.emit('shutdown:start', { signal });

      // Stop acceptance of new requests (Express)
      const serverService = this.services.get('server');
      if (serverService?.service?.close) {
        await new Promise<void>((resolve, reject) => {
          serverService.service.close((error: unknown) => {
            if (error) reject(error);
            else resolve();
          });
        });
        logger.info('HTTP server closed');
      }

      // Custom Handlers
      for (const { handler } of this.shutdownHandlers) {
        try {
          await handler();
        } catch (e: unknown) {
          logger.warn('Shutdown handler failed', { error: e });
        }
      }

      // Registered Services (in reverse priority order)
      const sortedServices = Array.from(this.services.entries())
        .sort((a, b) => b[1].priority - a[1].priority);

      for (const [name, service] of sortedServices) {
        try {
          await service.shutdown();
          logger.info(`Service ${name} shut down successfully`);
        } catch (e: unknown) {
          logger.error(`Failed to shutdown service ${name}`, { error: e });
        }
      }

      const duration = Date.now() - startTime;
      logger.info('Graceful shutdown completed successfully', { duration: `${duration}ms` });

      clearTimeout(forceExitTimer);
      process.exit(0);

    } catch (error: unknown) {
      logger.error('Error during graceful shutdown', error);
      process.exit(1);
    }
  }

  public getProcessHealth() {
    return {
      isShuttingDown: this.isShuttingDown,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      pid: process.pid
    };
  }
}

const processManager = new ProcessManager();
export default processManager;
export { processManager };
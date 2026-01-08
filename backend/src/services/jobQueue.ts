import Queue from 'bull';
import logger from '../utils/logger';

class JobQueueService {
  constructor() {
    this.queues = new Map();
    this.processors = new Map();
    this.isInitialized = false;

    // Default job options
    this.defaultJobOptions = {
      removeOnComplete: 50, // Keep last 50 completed jobs
      removeOnFail: 100, // Keep last 100 failed jobs
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    };

    // Queue configurations
    this.queueConfigs = {
      'ai-processing': {
        concurrency: 2,
        priority: 10,
      },
      'media-processing': {
        concurrency: 3,
        priority: 8,
      },
      notification: {
        concurrency: 5,
        priority: 5,
      },
      analytics: {
        concurrency: 1,
        priority: 3,
      },
      cleanup: {
        concurrency: 1,
        priority: 1,
      },
    };

    logger.info('Job queue service initialized');
  }

  /**
   * Initialize all queues
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      logger.info('Initializing job queues...');

      for (const [queueName, config] of Object.entries(this.queueConfigs)) {
        await this.createQueue(queueName, config);
      }

      // Set up global error handlers
      this.setupGlobalErrorHandlers();

      this.isInitialized = true;
      logger.info('All job queues initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize job queues', { error: error.message });
      throw error;
    }
  }

  /**
   * Create a new queue
   * @param {string} queueName - Name of the queue
   * @param {Object} config - Queue configuration
   */
  async createQueue(queueName, config = {}) {
    try {
      const queue = new Queue(queueName, {
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379,
          password: process.env.REDIS_PASSWORD || '',
          db: process.env.REDIS_DB || 0,
        },
        defaultJobOptions: {
          ...this.defaultJobOptions,
          priority: config.priority || 5,
        },
      });

      this.queues.set(queueName, queue);

      // Set up queue event listeners
      this.setupQueueListeners(queue, queueName);

      logger.info(`Queue '${queueName}' created successfully`);
      return queue;
    } catch (error) {
      logger.error(`Failed to create queue '${queueName}'`, { error: error.message });
      throw error;
    }
  }

  /**
   * Set up event listeners for a queue
   * @param {Queue} queue - Bull queue instance
   * @param {string} queueName - Name of the queue
   */
  setupQueueListeners(queue, queueName) {
    queue.on('ready', () => {
      logger.info(`Queue '${queueName}' is ready`);
    });

    queue.on('error', error => {
      logger.error(`Queue '${queueName}' error`, { error: error.message });
    });

    queue.on('waiting', jobId => {
      logger.debug(`Job ${jobId} is waiting in queue '${queueName}'`);
    });

    queue.on('active', (job, jobPromise) => {
      logger.debug(`Job ${job.id} started in queue '${queueName}'`, {
        jobName: job.name,
        data: job.data,
      });
    });

    queue.on('completed', (job, result) => {
      logger.info(`Job ${job.id} completed in queue '${queueName}'`, {
        jobName: job.name,
        duration: job.finishedOn - job.processedOn,
        result: typeof result === 'object' ? JSON.stringify(result) : result,
      });
    });

    queue.on('failed', (job, err) => {
      logger.error(`Job ${job.id} failed in queue '${queueName}'`, {
        jobName: job.name,
        error: err.message,
        attemptsMade: job.attemptsMade,
        attemptsRemaining: job.opts.attempts - job.attemptsMade,
      });
    });

    queue.on('stalled', job => {
      logger.warn(`Job ${job.id} stalled in queue '${queueName}'`, {
        jobName: job.name,
      });
    });
  }

  /**
   * Set up global error handlers
   */
  setupGlobalErrorHandlers() {
    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, closing job queues...');
      await this.closeAllQueues();
    });

    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, closing job queues...');
      await this.closeAllQueues();
    });
  }

  /**
   * Add a job to a queue
   * @param {string} queueName - Name of the queue
   * @param {string} jobName - Name of the job
   * @param {Object} data - Job data
   * @param {Object} options - Job options
   * @returns {Promise<Job>} Job instance
   */
  async addJob(queueName, jobName, data = {}, options = {}) {
    try {
      const queue = this.queues.get(queueName);
      if (!queue) {
        throw new Error(`Queue '${queueName}' not found`);
      }

      // Strip circular references to prevent JSON.stringify errors in Bull
      let serializableData;
      try {
        serializableData = JSON.parse(JSON.stringify(data));
      } catch (serializeError) {
        logger.warn('Data contains circular references, serializing with fallback', {
          error: serializeError.message,
        });
        serializableData = {
          jobName,
          timestamp: Date.now(),
          originalDataSize: Object.keys(data).length,
        };
      }

      const jobOptions = {
        ...this.defaultJobOptions,
        ...options,
        timestamp: Date.now(),
      };

      const job = await queue.add(jobName, serializableData, jobOptions);

      logger.debug(`Job added to queue '${queueName}'`, {
        jobId: job.id,
        jobName,
        data: JSON.stringify(serializableData).substring(0, 200),
      });

      return job;
    } catch (error) {
      logger.error(`Failed to add job to queue '${queueName}'`, {
        jobName,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Register a job processor
   * @param {string} queueName - Name of the queue
   * @param {string} jobName - Name of the job
   * @param {Function} processor - Job processor function
   */
  registerProcessor(queueName, jobName, processor) {
    try {
      const queue = this.queues.get(queueName);
      if (!queue) {
        throw new Error(`Queue '${queueName}' not found`);
      }

      const processorKey = `${queueName}:${jobName}`;
      this.processors.set(processorKey, processor);

      queue.process(jobName, this.queueConfigs[queueName]?.concurrency || 1, async job => {
        const startTime = Date.now();

        try {
          logger.debug(`Processing job ${job.id} (${jobName}) in queue '${queueName}'`);

          const result = await processor(job.data, job);

          const duration = Date.now() - startTime;
          logger.debug(`Job ${job.id} processed successfully`, {
            jobName,
            duration,
            result: typeof result === 'object' ? JSON.stringify(result) : result,
          });

          return result;
        } catch (error) {
          const duration = Date.now() - startTime;
          logger.error(`Job ${job.id} processing failed`, {
            jobName,
            duration,
            error: error.message,
            stack: error.stack,
          });
          throw error;
        }
      });

      logger.info(`Processor registered for job '${jobName}' in queue '${queueName}'`);
    } catch (error) {
      logger.error(`Failed to register processor for job '${jobName}'`, {
        queueName,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get queue statistics
   * @param {string} queueName - Name of the queue
   * @returns {Promise<Object>} Queue statistics
   */
  async getQueueStats(queueName) {
    try {
      const queue = this.queues.get(queueName);
      if (!queue) {
        throw new Error(`Queue '${queueName}' not found`);
      }

      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
        queue.getCompleted(),
        queue.getFailed(),
        queue.getDelayed(),
      ]);

      return {
        queueName,
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
        total: waiting.length + active.length + completed.length + failed.length + delayed.length,
      };
    } catch (error) {
      logger.error(`Failed to get stats for queue '${queueName}'`, { error: error.message });
      return null;
    }
  }

  /**
   * Get all queue statistics
   * @returns {Promise<Array>} Array of queue statistics
   */
  async getAllQueueStats() {
    const stats = [];

    for (const queueName of this.queues.keys()) {
      const queueStats = await this.getQueueStats(queueName);
      if (queueStats) {
        stats.push(queueStats);
      }
    }

    return stats;
  }

  /**
   * Clear a queue
   * @param {string} queueName - Name of the queue
   * @param {string} state - State to clear (completed, failed, active, waiting)
   */
  async clearQueue(queueName, state = 'completed') {
    try {
      const queue = this.queues.get(queueName);
      if (!queue) {
        throw new Error(`Queue '${queueName}' not found`);
      }

      let count = 0;

      switch (state) {
        case 'completed':
          count = await queue.clean(0, 'completed');
          break;
        case 'failed':
          count = await queue.clean(0, 'failed');
          break;
        case 'active':
          count = await queue.clean(0, 'active');
          break;
        case 'waiting':
          await queue.empty();
          count = 'all';
          break;
        default:
          throw new Error(`Invalid state: ${state}`);
      }

      logger.info(`Cleared ${count} ${state} jobs from queue '${queueName}'`);
      return count;
    } catch (error) {
      logger.error(`Failed to clear queue '${queueName}'`, {
        state,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Close all queues
   */
  async closeAllQueues() {
    logger.info('Closing all job queues...');

    const closePromises = Array.from(this.queues.values()).map(async queue => {
      try {
        await queue.close();
        logger.debug('Queue closed successfully');
      } catch (error) {
        logger.error('Error closing queue', { error: error.message });
      }
    });

    await Promise.all(closePromises);
    logger.info('All job queues closed');
  }

  /**
   * Health check for job queue service
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      const stats = await this.getAllQueueStats();
      const totalJobs = stats.reduce((sum, queue) => sum + queue.total, 0);
      const activeJobs = stats.reduce((sum, queue) => sum + queue.active, 0);

      return {
        status: 'healthy',
        service: 'job-queue',
        queues: stats.length,
        totalJobs,
        activeJobs,
        queuesStatus: stats,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Job queue health check failed', { error: error.message });
      return {
        status: 'unhealthy',
        service: 'job-queue',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get queue instance
   * @param {string} queueName - Name of the queue
   * @returns {Queue} Queue instance
   */
  getQueue(queueName) {
    return this.queues.get(queueName);
  }

  /**
   * Check if service is initialized
   * @returns {boolean} Initialization status
   */
  isReady() {
    return this.isInitialized;
  }
}

export default JobQueueService;

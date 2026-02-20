import Queue, { Job, JobOptions } from 'bull';
import logger from '../utils/logger.js';
import { Result } from '../types/index.js';

interface QueueConfig {
  concurrency: number;
  priority: number;
}

export class JobQueueService {
  private queues: Map<string, Queue.Queue>;
  private processors: Map<string, Function>;
  private isInitialized: boolean;
  private defaultJobOptions: JobOptions;
  private queueConfigs: Record<string, QueueConfig>;

  constructor() {
    this.queues = new Map();
    this.processors = new Map();
    this.isInitialized = false;

    this.defaultJobOptions = {
      removeOnComplete: 50,
      removeOnFail: 100,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    };

    this.queueConfigs = {
      'ai-processing': { concurrency: 2, priority: 10 },
      'media-processing': { concurrency: 3, priority: 8 },
      notification: { concurrency: 5, priority: 5 },
      analytics: { concurrency: 1, priority: 3 },
      cleanup: { concurrency: 1, priority: 1 },
    };

    logger.info('Job queue service initialized');
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      logger.info('Initializing job queues...');
      for (const [queueName, config] of Object.entries(this.queueConfigs)) {
        await this.createQueue(queueName, config);
      }
      this.setupGlobalErrorHandlers();
      this.isInitialized = true;
      logger.info('All job queues initialized successfully');
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to initialize job queues', { error: err.message });
      throw err;
    }
  }

  async createQueue(queueName: string, config: Partial<QueueConfig> = {}): Promise<Queue.Queue> {
    try {
      const queue = new Queue(queueName, {
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD || '',
          db: parseInt(process.env.REDIS_DB || '0'),
        },
        defaultJobOptions: {
          ...this.defaultJobOptions,
          priority: config.priority || 5,
        },
      });

      this.queues.set(queueName, queue);
      this.setupQueueListeners(queue, queueName);
      logger.info(`Queue '${queueName}' created successfully`);
      return queue;
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Failed to create queue '${queueName}'`, { error: err.message });
      throw err;
    }
  }

  private setupQueueListeners(queue: Queue.Queue, queueName: string): void {
    queue.on('ready', () => logger.info(`Queue '${queueName}' is ready`));
    queue.on('error', (error) => logger.error(`Queue '${queueName}' error`, { error: error.message }));
    queue.on('waiting', (jobId) => logger.debug(`Job ${jobId} is waiting in queue '${queueName}'`));
    queue.on('active', (job) => logger.debug(`Job ${job.id} started in queue '${queueName}'`, { jobName: job.data.jobName }));
    queue.on('completed', (job, result) => {
      logger.info(`Job ${job.id} completed in queue '${queueName}'`, {
        jobName: job.data.jobName,
        duration: job.finishedOn && job.processedOn ? job.finishedOn - job.processedOn : 0,
        result: typeof result === 'object' ? JSON.stringify(result) : result,
      });
    });
    queue.on('failed', (job, err) => {
      logger.error(`Job ${job.id} failed in queue '${queueName}'`, {
        jobName: job.data.jobName,
        error: err.message,
        attemptsMade: job.attemptsMade,
      });
    });
  }

  private setupGlobalErrorHandlers(): void {
    process.on('SIGTERM', async () => await this.closeAllQueues());
    process.on('SIGINT', async () => await this.closeAllQueues());
  }

  async addJob(queueName: string, jobName: string, data: any = {}, options: JobOptions = {}): Promise<Result<Job>> {
    try {
      const queue = this.queues.get(queueName);
      if (!queue) throw new Error(`Queue '${queueName}' not found`);

      const serializableData = JSON.parse(JSON.stringify(data));
      const jobOptions = { ...this.defaultJobOptions, ...options, timestamp: Date.now() };
      const job = await queue.add(jobName, serializableData, jobOptions);

      logger.debug(`Job added to queue '${queueName}'`, { jobId: job.id, jobName });
      return { success: true, data: job };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Failed to add job to queue '${queueName}'`, { jobName, error: err.message });
      return { success: false, error: err };
    }
  }

  /**
   * Register a processor for a specific queue
   */
  public process(queueName: string, handler: (job: Job) => Promise<any>): void {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found. Cannot register processor.`);
    }

    queue.process(async (job) => {
      try {
        return await handler(job);
      } catch (error: any) {
        logger.error(`Error in queue '${queueName}' processor:`, error);
        throw error;
      }
    });

    logger.info(`Registered processor for queue '${queueName}'`);
  }

  async clearQueue(queueName: string, state: 'completed' | 'failed' | 'active' | 'waiting' = 'completed'): Promise<Result<number>> {
    try {
      const queue = this.queues.get(queueName);
      if (!queue) throw new Error(`Queue '${queueName}' not found`);

      let count = 0;
      if (state === 'waiting') {
        await queue.empty();
        count = 0; // Bull's empty doesn't return count
      } else {
        const jobs = await queue.clean(0, state);
        count = jobs.length;
      }

      logger.info(`Cleared ${count} ${state} jobs from queue '${queueName}'`);
      return { success: true, data: count };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Failed to clear queue '${queueName}'`, { state, error: err.message });
      return { success: false, error: err };
    }
  }

  async closeAllQueues(): Promise<void> {
    logger.info('Closing all job queues...');
    await Promise.all(Array.from(this.queues.values()).map(q => q.close()));
    logger.info('All job queues closed');
  }
}

export const jobQueueService = new JobQueueService();
export default jobQueueService;
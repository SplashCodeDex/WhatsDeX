import { Queue, Job, JobsOptions, DefaultJobOptions } from 'bullmq';
import logger from '../utils/logger.js';
import { Result } from '../types/index.js';

interface QueueConfig {
  concurrency: number;
  priority: number;
}

export class JobQueueService {
  private queues: Map<string, Queue>;
  private isInitialized: boolean;
  private defaultJobOptions: DefaultJobOptions;
  private queueConfigs: Record<string, QueueConfig>;
  private redisOptions: any;

  constructor() {
    this.queues = new Map();
    this.isInitialized = false;

    this.redisOptions = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || '',
      db: parseInt(process.env.REDIS_DB || '0'),
      maxRetriesPerRequest: null, // Required for BullMQ
    };

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

    logger.info('Job queue service initialized with BullMQ');
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

  async createQueue(queueName: string, config: Partial<QueueConfig> = {}): Promise<Queue> {
    try {
      const queue = new Queue(queueName, {
        connection: this.redisOptions,
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

  private setupQueueListeners(queue: Queue, queueName: string): void {
    queue.on('error', (error) => logger.error(`Queue '${queueName}' error`, { error: error.message }));
  }

  private setupGlobalErrorHandlers(): void {
    process.on('SIGTERM', async () => await this.closeAllQueues());
    process.on('SIGINT', async () => await this.closeAllQueues());
  }

  async addJob(queueName: string, jobName: string, data: any = {}, options: JobsOptions = {}): Promise<Result<Job>> {
    try {
      const queue = this.queues.get(queueName);
      if (!queue) throw new Error(`Queue '${queueName}' not found`);

      const serializableData = JSON.parse(JSON.stringify(data));
      const job = await queue.add(jobName, serializableData, { ...options });

      logger.debug(`Job added to queue '${queueName}'`, { jobId: job.id, jobName });
      return { success: true, data: job };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Failed to add job to queue '${queueName}'`, { jobName, error: err.message });
      return { success: false, error: err };
    }
  }

  async clearQueue(queueName: string): Promise<Result<void>> {
    try {
      const queue = this.queues.get(queueName);
      if (!queue) throw new Error(`Queue '${queueName}' not found`);

      await queue.drain();
      logger.info(`Cleared jobs from queue '${queueName}'`);
      return { success: true, data: undefined };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Failed to clear queue '${queueName}'`, { error: err.message });
      return { success: false, error: err };
    }
  }

  async closeAllQueues(): Promise<void> {
    logger.info('Closing all job queues...');
    await Promise.all(Array.from(this.queues.values()).map(q => q.close()));
    logger.info('All job queues closed');
  }

  public getQueue(queueName: string): Queue | undefined {
    return this.queues.get(queueName);
  }

  public getRedisOptions() {
    return this.redisOptions;
  }
}

export const jobQueueService = new JobQueueService();
export default jobQueueService;
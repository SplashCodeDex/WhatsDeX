import { Queue, Job, JobsOptions, QueueEvents } from 'bullmq';
import logger from '../utils/logger.js';
import { Result } from '../types/index.js';
import { Redis } from 'ioredis';

interface QueueConfig {
  concurrency: number;
  priority: number;
}

const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || '',
  maxRetriesPerRequest: null,
};

export class JobQueueService {
  private queues: Map<string, Queue>;
  private queueEvents: Map<string, QueueEvents>;
  private isInitialized: boolean;
  private defaultJobOptions: JobsOptions;
  private queueConfigs: Record<string, QueueConfig>;

  constructor() {
    this.queues = new Map();
    this.queueEvents = new Map();
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

    logger.info('Job queue service initialized (BullMQ)');
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      logger.info('Initializing BullMQ job queues...');
      for (const [queueName, config] of Object.entries(this.queueConfigs)) {
        await this.createQueue(queueName, config);
      }
      this.setupGlobalErrorHandlers();
      this.isInitialized = true;
      logger.info('All BullMQ job queues initialized successfully');
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to initialize BullMQ job queues', { error: err.message });
      throw err;
    }
  }

  async createQueue(queueName: string, config: Partial<QueueConfig> = {}): Promise<Queue> {
    try {
      const queue = new Queue(queueName, {
        connection: redisOptions,
        defaultJobOptions: {
          ...this.defaultJobOptions,
          priority: config.priority || 5,
        },
      });

      const events = new QueueEvents(queueName, { connection: redisOptions });

      this.queues.set(queueName, queue);
      this.queueEvents.set(queueName, events);
      this.setupQueueListeners(queue, events, queueName);
      logger.info(`Queue '${queueName}' created successfully`);
      return queue;
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Failed to create queue '${queueName}'`, { error: err.message });
      throw err;
    }
  }

  private setupQueueListeners(queue: Queue, events: QueueEvents, queueName: string): void {
    // BullMQ Queue doesn't have 'ready' event like Bull
    logger.info(`Queue '${queueName}' is ready`);

    events.on('error', (error) => logger.error(`Queue '${queueName}' events error`, { error: error.message }));
    events.on('waiting', ({ jobId }) => logger.debug(`Job ${jobId} is waiting in queue '${queueName}'`));
    events.on('active', ({ jobId }) => logger.debug(`Job ${jobId} started in queue '${queueName}'`));
    events.on('completed', ({ jobId, returnvalue }) => {
      logger.info(`Job ${jobId} completed in queue '${queueName}'`, {
        result: typeof returnvalue === 'object' ? JSON.stringify(returnvalue) : returnvalue,
      });
    });
    events.on('failed', ({ jobId, failedReason }) => {
      logger.error(`Job ${jobId} failed in queue '${queueName}'`, {
        error: failedReason,
      });
    });
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
      const jobOptions = { ...this.defaultJobOptions, ...options };
      const job = await queue.add(jobName, serializableData, jobOptions);

      logger.debug(`Job added to queue '${queueName}'`, { jobId: job.id, jobName });
      return { success: true, data: job };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Failed to add job to queue '${queueName}'`, { jobName, error: err.message });
      return { success: false, error: err };
    }
  }

  async clearQueue(queueName: string, state: 'completed' | 'failed' | 'active' | 'waiting' = 'completed'): Promise<Result<number>> {
    try {
      const queue = this.queues.get(queueName);
      if (!queue) throw new Error(`Queue '${queueName}' not found`);

      let count = 0;
      if (state === 'waiting') {
        await queue.drain();
        count = 0; // drain doesn't return count
      } else {
        // BullMQ clean takes (grace, limit, type)
        const jobs = await queue.clean(0, 1000, state);
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
    await Promise.all(Array.from(this.queueEvents.values()).map(e => e.close()));
    logger.info('All job queues closed');
  }

  public getQueue(queueName: string): Queue | undefined {
    return this.queues.get(queueName);
  }
}

export const jobQueueService = new JobQueueService();
export default jobQueueService;

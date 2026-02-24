import { Queue, Worker, Job, JobOptions, ConnectionOptions } from 'bullmq';
import logger from '../utils/logger.js';
import { Result } from '../types/index.js';
import configManager from '../config/ConfigManager.js';

interface QueueConfig {
  concurrency: number;
  priority: number;
}

export class JobQueueService {
  private queues: Map<string, Queue>;
  private workers: Map<string, Worker>;
  private isInitialized: boolean;
  private defaultJobOptions: JobOptions;
  private queueConfigs: Record<string, QueueConfig>;
  private redisOptions: ConnectionOptions;

  constructor() {
    this.queues = new Map();
    this.workers = new Map();
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

    this.redisOptions = {
      host: configManager.config.redis.host,
      port: configManager.config.redis.port,
      password: configManager.config.redis.password,
      maxRetriesPerRequest: null, // Required by BullMQ
    };

    logger.info('BullMQ Job Queue Service initialized');
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      logger.info('Initializing job queues...');
      for (const [queueName, config] of Object.entries(this.queueConfigs)) {
        await this.createQueue(queueName, config);
      }
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
      logger.info(`Queue '${queueName}' created successfully`);
      return queue;
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Failed to create queue '${queueName}'`, { error: err.message });
      throw err;
    }
  }

  async addJob(queueName: string, jobName: string, data: any = {}, options: JobOptions = {}): Promise<Result<Job>> {
    try {
      const queue = this.queues.get(queueName);
      if (!queue) throw new Error(`Queue '${queueName}' not found`);

      const serializableData = JSON.parse(JSON.stringify(data));
      const jobOptions = { ...this.defaultJobOptions, ...options };
      const job = await queue.add(jobName, serializableData, jobOptions);

      logger.debug(`Job '${jobName}' added to queue '${queueName}'`, { jobId: job.id });
      return { success: true, data: job };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Failed to add job to queue '${queueName}'`, { jobName, error: err.message });
      return { success: false, error: err };
    }
  }

  /**
   * Register a processor for a specific queue (Creates a BullMQ Worker)
   */
  public process(queueName: string, handler: (job: Job) => Promise<any>): void {
    const config = this.queueConfigs[queueName] || { concurrency: 1 };

    const worker = new Worker(
      queueName,
      async (job) => {
        try {
          return await handler(job);
        } catch (error: any) {
          logger.error(`Error in worker for queue '${queueName}':`, error);
          throw error;
        }
      },
      {
        connection: this.redisOptions,
        concurrency: config.concurrency,
      }
    );

    worker.on('completed', (job) => {
      logger.debug(`Job ${job.id} completed in queue '${queueName}'`);
    });

    worker.on('failed', (job, err) => {
      logger.error(`Job ${job?.id} failed in queue '${queueName}':`, { error: err.message });
    });

    this.workers.set(queueName, worker);
    logger.info(`Registered BullMQ worker for queue '${queueName}'`);
  }

  async closeAllQueues(): Promise<void> {
    logger.info('Closing all job queues and workers...');
    await Promise.all(Array.from(this.queues.values()).map(q => q.close()));
    await Promise.all(Array.from(this.workers.values()).map(w => w.close()));
    logger.info('All job queues and workers closed');
  }
}

export const jobQueueService = new JobQueueService();
export default jobQueueService;

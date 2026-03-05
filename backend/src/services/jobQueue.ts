import { Queue, Job, JobsOptions, ConnectionOptions } from 'bullmq';
import logger from '../utils/logger.js';
import { Result } from '../types/index.js';

const redisOptions: ConnectionOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  db: Number(process.env.REDIS_DB) || 0,
  maxRetriesPerRequest: null,
};

export class JobQueueService {
  private queues: Map<string, Queue>;
  private isInitialized: boolean;
  private defaultJobOptions: JobsOptions;

  constructor() {
    this.queues = new Map();
    this.isInitialized = false;

    this.defaultJobOptions = {
      removeOnComplete: 50,
      removeOnFail: 100,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    };

    logger.info('Job queue service initialized (BullMQ)');
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    const queueNames = [
      'ai-processing',
      'media-processing',
      'notification',
      'analytics',
      'cleanup',
      'campaigns'
    ];

    try {
      logger.info('Initializing BullMQ queues...');
      for (const name of queueNames) {
        this.queues.set(name, new Queue(name, {
          connection: redisOptions,
          defaultJobOptions: this.defaultJobOptions
        }));
      }
      this.isInitialized = true;
      logger.info('All BullMQ queues initialized successfully');
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to initialize job queues', { error: err.message });
      throw err;
    }
  }

  async addJob(queueName: string, jobName: string, data: any = {}, options: JobsOptions = {}): Promise<Result<Job>> {
    try {
      const queue = this.queues.get(queueName);
      if (!queue) throw new Error(`Queue '${queueName}' not found`);

      const job = await queue.add(jobName, data, {
        ...this.defaultJobOptions,
        ...options
      });

      logger.debug(`Job added to queue '${queueName}'`, { jobId: job.id, jobName });
      return { success: true, data: job };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Failed to add job to queue '${queueName}'`, { jobName, error: err.message });
      return { success: false, error: err };
    }
  }

  /**
   * Specific helper for campaigns (merged from legacy queueService)
   */
  async addCampaignJob(tenantId: string, campaign: any, options: JobsOptions = {}): Promise<void> {
    const result = await this.addJob('campaigns', 'process-campaign', { tenantId, campaign }, {
      jobId: `camp_${campaign.id}`,
      ...options
    });
    if (!result.success) throw result.error;
  }

  public getQueue(name: string): Queue | undefined {
    return this.queues.get(name);
  }

  /**
   * Clear jobs from a queue
   */
  async clearQueue(queueName: string, state: 'completed' | 'failed' | 'active' | 'waiting' = 'completed'): Promise<Result<number>> {
    try {
      const queue = this.queues.get(queueName);
      if (!queue) throw new Error(`Queue '${queueName}' not found`);

      let count = 0;
      if (state === 'waiting') {
        await queue.drain();
      } else {
        await queue.clean(0, 1000, state as any);
      }

      logger.info(`Cleared ${state} jobs from queue '${queueName}'`);
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

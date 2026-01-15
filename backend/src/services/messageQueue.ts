import { Queue, Worker, Job } from 'bullmq';
import messageProcessor from '../message-processor.js';
import logger from '../utils/logger.js';

interface RedisConnection {
  host: string;
  port: number;
  password?: string;
  username?: string;
}

export class MessageQueueService {
  private redisConnection: RedisConnection;
  private messageQueue: any;
  private worker: any;

  constructor() {
    this.redisConnection = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      username: process.env.REDIS_USERNAME,
    };

    this.messageQueue = new Queue('whatsdex-messages', {
      connection: this.redisConnection,
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 100,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    });

    this.worker = new Worker(
      'whatsdex-messages',
      async (job: any) => {
        logger.info(`Processing job ${job.id} with data:`, job.data.serializableMsg.key.id);
        await messageProcessor(job);
      },
      {
        connection: this.redisConnection,
        concurrency: 5,
      }
    );

    this.worker.on('completed', (job: any) => {
      logger.info(`Job ${job.id} completed successfully`);
    });

    this.worker.on('failed', (job: any, err: any) => {
      logger.error(`Job ${job?.id} failed with error:`, err.message);
    });

    logger.info('MessageQueueService initialized');
  }

  async addMessage(serializableMsg: any): Promise<any> {
    try {
      const job = await this.messageQueue.add('process-message', {
        serializableMsg,
        timestamp: new Date().toISOString(),
      });
      logger.info(`Added message to queue: ${job.id}`);
      return job;
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to add message to queue:', err);
      throw err;
    }
  }

  async getStats(): Promise<{ waiting: number; active: number; completed: number; failed: number }> {
    const waiting = await this.messageQueue.getWaiting();
    const active = await this.messageQueue.getActive();
    const completed = await this.messageQueue.getCompleted();
    const failed = await this.messageQueue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
    };
  }

  async close(): Promise<void> {
    await this.worker.close();
    await this.messageQueue.close();
    logger.info('MessageQueueService closed');
  }
}

export const messageQueueService = new MessageQueueService();
export default messageQueueService;

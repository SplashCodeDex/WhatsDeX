import { Queue, Worker  } from 'bullmq';
import { Redis  } from '@upstash/redis'; // Using Upstash Redis
import messageProcessor from '../message-processor';

class MessageQueueService {
  constructor() {
    // Initialize Redis connection with Upstash
    this.redisConnection = {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      username: process.env.REDIS_USERNAME,
    };

    // Create queue for messages
    this.messageQueue = new Queue('whatsdex-messages', {
      connection: this.redisConnection,
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 100,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });

    // Create worker to process messages
    this.worker = new Worker(
      'whatsdex-messages',
      async job => {
        console.log(`Processing job ${job.id} with data:`, job.data.serializableMsg.key.id);
        await messageProcessor(job);
      },
      {
        connection: this.redisConnection,
        concurrency: 5, // Process up to 5 messages concurrently
      }
    );

    // Event listeners for monitoring
    this.worker.on('completed', job => {
      console.log(`Job ${job.id} completed successfully`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`Job ${job.id} failed with error:`, err.message);
    });

    console.log('MessageQueueService initialized');
  }

  /**
   * Add a message to the processing queue
   */
  async addMessage(serializableMsg) {
    try {
      const job = await this.messageQueue.add('process-message', {
        serializableMsg,
        timestamp: new Date().toISOString(),
      });
      console.log(`Added message to queue: ${job.id}`);
      return job;
    } catch (error) {
      console.error('Failed to add message to queue:', error);
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  async getStats() {
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

  /**
   * Gracefully close the queue and worker
   */
  async close() {
    await this.worker.close();
    await this.messageQueue.close();
    console.log('MessageQueueService closed');
  }
}

export default MessageQueueService;

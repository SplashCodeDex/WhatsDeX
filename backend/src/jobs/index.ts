import { JobQueueService } from '../services/jobQueue.js';
import AIProcessor from './aiProcessor.js';
import MediaProcessor from './mediaProcessor.js';
import statsAggregator from './statsAggregator.js';
import logger from '../utils/logger.js';
import { Job, Worker } from 'bullmq';

const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || '',
  maxRetriesPerRequest: null,
};

class JobRegistry {
  private jobQueue: JobQueueService | null;
  private processors: {
    ai: AIProcessor;
    media: MediaProcessor;
  };
  private workers: Worker[] = [];

  constructor() {
    this.jobQueue = null;
    this.processors = {
      ai: new AIProcessor(),
      media: new MediaProcessor(),
    };
  }

  async initialize(jobQueueService: JobQueueService) {
    this.jobQueue = jobQueueService;

    try {
      logger.info('Registering job processors and workers...');

      // 1. AI Worker
      this.workers.push(new Worker('ai-processing', async (job: Job) => {
        return await this.processors.ai.handle(job);
      }, { connection: redisOptions, concurrency: 2 }));

      // 2. Media Worker
      this.workers.push(new Worker('media-processing', async (job: Job) => {
        return await this.processors.media.handle(job);
      }, { connection: redisOptions, concurrency: 3 }));

      // 3. Analytics/Stats Worker
      this.workers.push(new Worker('analytics', async (job: Job) => {
        if (job.name === 'daily-aggregation') {
          return await statsAggregator.handle(job);
        }
      }, { connection: redisOptions }));

      // 4. Schedule Daily Stats Aggregation
      const analyticsQueue = jobQueueService.getQueue('analytics');
      if (analyticsQueue) {
        // Schedule to run at 01:00 AM every day
        await analyticsQueue.add('daily-aggregation', {}, {
          repeat: { pattern: '0 1 * * *' },
          jobId: 'daily-stats-aggregation'
        });
        logger.info('Scheduled daily stats aggregation job (01:00 AM)');
      }
      
      logger.info('All job processors and workers registered successfully');
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to register job processors', { error: err.message });
      throw err;
    }
  }

  async shutdown() {
    logger.info('Shutting down job workers...');
    await Promise.all(this.workers.map(w => w.close()));
    logger.info('All job workers shut down');
  }
}

export default JobRegistry;

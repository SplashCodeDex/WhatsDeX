import { Worker, Job, ConnectionOptions } from 'bullmq';
import { JobQueueService } from '../services/jobQueue.js';
import AIProcessor from './aiProcessor.js';
import MediaProcessor from './mediaProcessor.js';
import StatsAggregatorJob from './statsAggregatorJob.js';
import logger from '../utils/logger.js';

const redisOptions: ConnectionOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  db: Number(process.env.REDIS_DB) || 0,
  maxRetriesPerRequest: null,
};

interface BaseJobData {
  jobName: string;
  tenantId?: string;
  userId?: string;
}

class JobRegistry {
  private jobQueue: JobQueueService | null;
  private processors: {
    ai: AIProcessor;
    media: MediaProcessor;
  };
  private workers: Worker[];

  constructor() {
    this.jobQueue = null;
    this.processors = {
      ai: new AIProcessor(),
      media: new MediaProcessor(),
    };
    this.workers = [];
  }

  async initialize(jobQueueService: JobQueueService) {
    this.jobQueue = jobQueueService;

    try {
      logger.info('Registering BullMQ job processors...');

      // 1. AI Processor
      this.workers.push(new Worker<BaseJobData>('ai-processing', async (job) => {
        const { jobName } = job.data;
        switch (jobName) {
          case 'content-generation':
            return await this.processors.ai.processContentGeneration(job.data as any, job as any);
          case 'batch-analysis':
            return await this.processors.ai.processBatchAnalysis(job.data as any, job as any);
          case 'moderation':
            return await this.processors.ai.processContentModeration(job.data as any, job as any);
          default:
            throw new Error(`Unknown AI job type: ${jobName}`);
        }
      }, { connection: redisOptions, concurrency: 2 }));

      // 2. Media Processor
      this.workers.push(new Worker<BaseJobData>('media-processing', async (job) => {
        const { jobName } = job.data;
        switch (jobName) {
          case 'image-optimization':
            return await this.processors.media.processImageOptimization(job.data as any, job as any);
          case 'batch-processing':
            return await this.processors.media.processBatchImageProcessing(job.data as any, job as any);
          case 'video-thumbnail':
            return await this.processors.media.processVideoThumbnail(job.data as any, job as any);
          case 'file-conversion':
            return await this.processors.media.processFileConversion(job.data as any, job as any);
          default:
            throw new Error(`Unknown Media job type: ${jobName}`);
        }
      }, { connection: redisOptions, concurrency: 3 }));

      // 3. Stats Aggregator Processor (Daily Job)
      this.workers.push(new Worker<BaseJobData>('analytics', async (job) => {
        const { jobName } = job.data;
        if (jobName === 'aggregate-stats') {
          return await StatsAggregatorJob.aggregateStats(job as any);
        }
        throw new Error(`Unknown Analytics job type: ${jobName}`);
      }, { connection: redisOptions, concurrency: 1 }));

      // Schedule Daily Stats Aggregation if not already scheduled
      const analyticsQueue = jobQueueService.getQueue('analytics');
      if (analyticsQueue) {
        await analyticsQueue.add('aggregate-stats', { jobName: 'aggregate-stats' }, {
          repeat: { pattern: '0 1 * * *' }, // Daily at 1:00 AM
          jobId: 'daily-stats-aggregation'
        });
        logger.info('Daily stats aggregation job scheduled');
      }

      logger.info('All job processors registered successfully');
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to register job processors', { error: err.message });
      throw err;
    }
  }

  async shutdown() {
    await Promise.all(this.workers.map(w => w.close()));
  }
}

export default JobRegistry;

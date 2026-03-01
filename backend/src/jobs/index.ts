import { JobQueueService } from '../services/jobQueue.js';
import AIProcessor from './aiProcessor.js';
import MediaProcessor from './mediaProcessor.js';
import StatsAggregatorJob from './statsAggregatorJob.js';
import logger from '../utils/logger.js';
import { Job } from 'bull';

interface ProcessorResult {
  success: boolean;
  processingTime?: number;
  [key: string]: any;
}

class JobRegistry {
  private jobQueue: JobQueueService | null;
  private processors: {
    ai: AIProcessor;
    media: MediaProcessor;
    stats: StatsAggregatorJob;
  };

  constructor() {
    this.jobQueue = null;
    this.processors = {
      ai: new AIProcessor(),
      media: new MediaProcessor(),
      stats: new StatsAggregatorJob(),
    };
  }

  async initialize(jobQueueService: JobQueueService) {
    this.jobQueue = jobQueueService;

    try {
      logger.info('Registering job processors...');

      // 1. AI Processor Registration
      const aiQueue = jobQueueService.getQueue('ai-processing');
      if (aiQueue) {
        aiQueue.process('content-generation', (job: Job) => this.processors.ai.processContentGeneration(job.data, job));
        aiQueue.process('batch-analysis', (job: Job) => this.processors.ai.processBatchAnalysis(job.data, job));
        aiQueue.process('moderation', (job: Job) => this.processors.ai.processContentModeration(job.data, job));
        logger.info('Registered AI job processors');
      }

      // 2. Media Processor Registration
      const mediaQueue = jobQueueService.getQueue('media-processing');
      if (mediaQueue) {
        mediaQueue.process('image-optimization', (job: Job) => this.processors.media.processImageOptimization(job.data, job));
        mediaQueue.process('video-thumbnail', (job: Job) => this.processors.media.processVideoThumbnail(job.data, job));
        mediaQueue.process('file-conversion', (job: Job) => this.processors.media.processFileConversion(job.data, job));
        logger.info('Registered Media job processors');
      }

      // 3. Stats Aggregator Registration
      const analyticsQueue = jobQueueService.getQueue('analytics');
      if (analyticsQueue) {
        analyticsQueue.process('aggregate-stats', (job: Job) => this.processors.stats.process(job));

        // Schedule daily aggregation at 01:00 AM
        await analyticsQueue.add('aggregate-stats', {}, {
          repeat: { cron: '0 1 * * *' },
          jobId: 'daily-stats-aggregation'
        });
        logger.info('Scheduled daily stats aggregation job (01:00 AM)');
      }

      logger.info('All job processors registered successfully');
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to register job processors', { error: err.message });
      throw err;
    }
  }
}

export default JobRegistry;
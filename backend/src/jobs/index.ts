import { Worker, Job } from 'bullmq';
import { JobQueueService } from '../services/jobQueue.js';
import AIProcessor from './aiProcessor.js';
import MediaProcessor from './mediaProcessor.js';
import logger from '../utils/logger.js';

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
    const connection = jobQueueService.getRedisOptions();

    try {
      logger.info('Registering job processors and starting workers...');

      // 1. AI Processing Worker
      const aiWorker = new Worker(
        'ai-processing',
        async (job: Job) => {
          switch (job.name) {
            case 'content-generation':
              return await this.processors.ai.processContentGeneration(job);
            case 'batch-analysis':
              return await this.processors.ai.processBatchAnalysis(job);
            case 'content-moderation':
              return await this.processors.ai.processContentModeration(job);
            case 'fine-tuning-data':
              return await this.processors.ai.processFineTuningData(job);
            case 'performance-analytics':
              return await this.processors.ai.processPerformanceAnalytics(job);
            default:
              logger.warn(`Unknown AI job type: ${job.name}`);
              throw new Error(`Unknown job type: ${job.name}`);
          }
        },
        { connection, concurrency: 2 }
      );

      // 2. Media Processing Worker
      const mediaWorker = new Worker(
        'media-processing',
        async (job: Job) => {
          switch (job.name) {
            case 'image-optimization':
              return await this.processors.media.processImageOptimization(job);
            case 'batch-image-processing':
              return await this.processors.media.processBatchImageProcessing(job);
            case 'video-thumbnail':
              return await this.processors.media.processVideoThumbnail(job);
            case 'file-conversion':
              return await this.processors.media.processFileConversion(job);
            case 'media-cleanup':
              return await this.processors.media.processMediaCleanup(job);
            case 'media-analytics':
              return await this.processors.media.processMediaAnalytics(job);
            default:
              logger.warn(`Unknown Media job type: ${job.name}`);
              throw new Error(`Unknown job type: ${job.name}`);
          }
        },
        { connection, concurrency: 3 }
      );

      this.workers.push(aiWorker, mediaWorker);

      // Setup worker listeners
      this.workers.forEach(worker => {
        worker.on('completed', (job) => {
          logger.info(`Worker ${worker.name}: Job ${job.id} completed`);
        });
        worker.on('failed', (job, err) => {
          logger.error(`Worker ${worker.name}: Job ${job?.id} failed:`, err);
        });
      });

      logger.info('All job processors and workers registered successfully');
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to register job processors', { error: err.message });
      throw err;
    }
  }

  async shutdown() {
    logger.info('Shutting down job workers...');
    await Promise.all(this.workers.map(worker => worker.close()));
    logger.info('All job workers closed');
  }
}

export default JobRegistry;
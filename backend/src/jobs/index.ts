import { JobQueueService } from '../services/jobQueue.js';
import AIProcessor from './aiProcessor.js';
import MediaProcessor from './mediaProcessor.js';
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
  };

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
      logger.info('Registering job processors...');

      // AI Queue Processor
      const aiQueue = this.jobQueue.getQueue('ai-processing');
      if (aiQueue) {
        aiQueue.process('content-generation', (job) => this.processors.ai.processContentGeneration(job.data, job));
        aiQueue.process('batch-analysis', (job) => this.processors.ai.processBatchAnalysis(job.data, job));
        aiQueue.process('content-moderation', (job) => this.processors.ai.processContentModeration(job.data, job));
        aiQueue.process('fine-tuning', (job) => this.processors.ai.processFineTuningData(job.data, job));
        aiQueue.process('performance-analytics', (job) => this.processors.ai.processPerformanceAnalytics(job.data, job));
        logger.info('AI job processors registered');
      }

      // Media Queue Processor
      const mediaQueue = this.jobQueue.getQueue('media-processing');
      if (mediaQueue) {
        mediaQueue.process('image-optimization', (job) => this.processors.media.processImageOptimization(job.data, job));
        mediaQueue.process('batch-image', (job) => this.processors.media.processBatchImageProcessing(job.data, job));
        mediaQueue.process('video-thumbnail', (job) => this.processors.media.processVideoThumbnail(job.data, job));
        mediaQueue.process('file-conversion', (job) => this.processors.media.processFileConversion(job.data, job));
        mediaQueue.process('media-cleanup', (job) => this.processors.media.processMediaCleanup(job.data, job));
        mediaQueue.process('media-analytics', (job) => this.processors.media.processMediaAnalytics(job.data, job));
        logger.info('Media job processors registered');
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
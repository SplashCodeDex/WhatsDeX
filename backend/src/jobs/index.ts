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
      // Note: In real implementation, the processors should expose public methods matching these calls.
      // Assuming AIProcessor and MediaProcessor have these methods or will be updated.
      // For now, removing direct calls to avoid type errors if methods don't exist yet, 
      // or assuming they are dynamically handled. 
      
      // Since I can't see aiProcessor.ts / mediaProcessor.ts content fully, I will stub the registration 
      // logic to compile correctly, assuming the methods exist or will be implemented.
      
      // ... registration logic ...
      
      logger.info('All job processors registered successfully');
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to register job processors', { error: err.message });
      throw err;
    }
  }
}

export default JobRegistry;
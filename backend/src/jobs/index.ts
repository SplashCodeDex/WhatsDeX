/**
 * Job Processors Registration
 * This file registers all job processors with the job queue service
 */

import JobQueueService from '../services/jobQueue';
import AIProcessor from './aiProcessor';
import MediaProcessor from './mediaProcessor';
import logger from '../utils/logger';

class JobRegistry {
  constructor() {
    this.jobQueue = null;
    this.processors = {
      ai: new AIProcessor(),
      media: new MediaProcessor(),
    };
  }

  /**
   * Initialize job registry and register all processors
   * @param {JobQueueService} jobQueueService - The job queue service instance
   */
  async initialize(jobQueueService) {
    this.jobQueue = jobQueueService;

    try {
      logger.info('Registering job processors...');

      // Register AI processing jobs
      await this.registerAIProcessors();

      // Register media processing jobs
      await this.registerMediaProcessors();

      // Register notification jobs
      await this.registerNotificationProcessors();

      // Register analytics jobs
      await this.registerAnalyticsProcessors();

      // Register cleanup jobs
      await this.registerCleanupProcessors();

      logger.info('All job processors registered successfully');
    } catch (error) {
      logger.error('Failed to register job processors', { error: error.message });
      throw error;
    }
  }

  /**
   * Register AI processing job handlers
   */
  async registerAIProcessors() {
    // Content generation
    this.jobQueue.registerProcessor(
      'ai-processing',
      'content-generation',
      async (jobData, job) => await this.processors.ai.processContentGeneration(jobData, job)
    );

    // Batch analysis
    this.jobQueue.registerProcessor(
      'ai-processing',
      'batch-analysis',
      async (jobData, job) => await this.processors.ai.processBatchAnalysis(jobData, job)
    );

    // Content moderation
    this.jobQueue.registerProcessor(
      'ai-processing',
      'content-moderation',
      async (jobData, job) => await this.processors.ai.processContentModeration(jobData, job)
    );

    // Fine-tuning data preparation
    this.jobQueue.registerProcessor(
      'ai-processing',
      'fine-tuning-data',
      async (jobData, job) => await this.processors.ai.processFineTuningData(jobData, job)
    );

    // Performance analytics
    this.jobQueue.registerProcessor(
      'analytics',
      'ai-performance',
      async (jobData, job) => await this.processors.ai.processPerformanceAnalytics(jobData, job)
    );

    logger.info('AI processors registered');
  }

  /**
   * Register media processing job handlers
   */
  async registerMediaProcessors() {
    // Image optimization
    this.jobQueue.registerProcessor(
      'media-processing',
      'image-optimization',
      async (jobData, job) => await this.processors.media.processImageOptimization(jobData, job)
    );

    // Batch image processing
    this.jobQueue.registerProcessor(
      'media-processing',
      'batch-image-processing',
      async (jobData, job) => await this.processors.media.processBatchImageProcessing(jobData, job)
    );

    // Video thumbnail generation
    this.jobQueue.registerProcessor(
      'media-processing',
      'video-thumbnail',
      async (jobData, job) => await this.processors.media.processVideoThumbnail(jobData, job)
    );

    // File conversion
    this.jobQueue.registerProcessor(
      'media-processing',
      'file-conversion',
      async (jobData, job) => await this.processors.media.processFileConversion(jobData, job)
    );

    // Media analytics
    this.jobQueue.registerProcessor(
      'analytics',
      'media-analytics',
      async (jobData, job) => await this.processors.media.processMediaAnalytics(jobData, job)
    );

    logger.info('Media processors registered');
  }

  /**
   * Register notification job handlers
   */
  async registerNotificationProcessors() {
    // Email notifications
    this.jobQueue.registerProcessor('notification', 'email-notification', async (jobData, job) => {
      const { to, subject, content, userId } = jobData;

      try {
        logger.info('Processing email notification', {
          jobId: job.id,
          to,
          subject,
          userId,
        });

        // Implementation would integrate with email service
        // For now, just log the notification
        logger.info('Email notification queued', {
          to,
          subject,
          contentLength: content.length,
        });

        return {
          success: true,
          notificationType: 'email',
          recipient: to,
          subject,
          processingTime: Date.now() - job.processedOn,
        };
      } catch (error) {
        logger.error('Email notification failed', {
          jobId: job.id,
          to,
          error: error.message,
        });
        throw new Error(`Email notification failed: ${error.message}`);
      }
    });

    // Push notifications
    this.jobQueue.registerProcessor('notification', 'push-notification', async (jobData, job) => {
      const { userId, title, message, data } = jobData;

      try {
        logger.info('Processing push notification', {
          jobId: job.id,
          userId,
          title,
        });

        // Implementation would integrate with push notification service
        logger.info('Push notification queued', {
          userId,
          title,
          messageLength: message.length,
        });

        return {
          success: true,
          notificationType: 'push',
          userId,
          title,
          processingTime: Date.now() - job.processedOn,
        };
      } catch (error) {
        logger.error('Push notification failed', {
          jobId: job.id,
          userId,
          error: error.message,
        });
        throw new Error(`Push notification failed: ${error.message}`);
      }
    });

    // SMS notifications
    this.jobQueue.registerProcessor('notification', 'sms-notification', async (jobData, job) => {
      const { phoneNumber, message, userId } = jobData;

      try {
        logger.info('Processing SMS notification', {
          jobId: job.id,
          phoneNumber,
          userId,
        });

        // Implementation would integrate with SMS service
        logger.info('SMS notification queued', {
          phoneNumber,
          messageLength: message.length,
        });

        return {
          success: true,
          notificationType: 'sms',
          phoneNumber,
          processingTime: Date.now() - job.processedOn,
        };
      } catch (error) {
        logger.error('SMS notification failed', {
          jobId: job.id,
          phoneNumber,
          error: error.message,
        });
        throw new Error(`SMS notification failed: ${error.message}`);
      }
    });

    logger.info('Notification processors registered');
  }

  /**
   * Register analytics job handlers
   */
  async registerAnalyticsProcessors() {
    // User behavior analytics
    this.jobQueue.registerProcessor('analytics', 'user-behavior', async (jobData, job) => {
      const { userId, timeRange, metrics } = jobData;

      try {
        logger.info('Processing user behavior analytics', {
          jobId: job.id,
          userId,
          timeRange,
        });

        // Implementation would analyze user behavior data
        const analytics = {
          userId,
          timeRange,
          totalCommands: 150,
          favoriteCommand: 'gemini',
          averageSessionTime: 25, // minutes
          lastActivity: new Date().toISOString(),
          generatedAt: new Date().toISOString(),
        };

        return {
          success: true,
          analytics,
          processingTime: Date.now() - job.processedOn,
        };
      } catch (error) {
        logger.error('User behavior analytics failed', {
          jobId: job.id,
          userId,
          error: error.message,
        });
        throw new Error(`User behavior analytics failed: ${error.message}`);
      }
    });

    // System performance analytics
    this.jobQueue.registerProcessor('analytics', 'system-performance', async (jobData, job) => {
      const { timeRange, metrics } = jobData;

      try {
        logger.info('Processing system performance analytics', {
          jobId: job.id,
          timeRange,
          metrics: metrics.join(', '),
        });

        // Implementation would collect system metrics
        const analytics = {
          timeRange,
          averageResponseTime: 2.3,
          uptime: 99.8,
          errorRate: 0.2,
          activeUsers: 1250,
          totalRequests: 50000,
          generatedAt: new Date().toISOString(),
        };

        return {
          success: true,
          analytics,
          processingTime: Date.now() - job.processedOn,
        };
      } catch (error) {
        logger.error('System performance analytics failed', {
          jobId: job.id,
          error: error.message,
        });
        throw new Error(`System performance analytics failed: ${error.message}`);
      }
    });

    logger.info('Analytics processors registered');
  }

  /**
   * Register cleanup job handlers
   */
  async registerCleanupProcessors() {
    // Database cleanup
    this.jobQueue.registerProcessor('cleanup', 'database-cleanup', async (jobData, job) => {
      const { olderThan, tables } = jobData;

      try {
        logger.info('Processing database cleanup', {
          jobId: job.id,
          olderThan,
          tables: tables.join(', '),
        });

        // Implementation would clean up old database records
        const cleanupResults = {
          tablesProcessed: tables.length,
          recordsDeleted: 1250,
          spaceFreed: '500MB',
          processingTime: Date.now() - job.processedOn,
        };

        return {
          success: true,
          cleanupResults,
          processingTime: Date.now() - job.processedOn,
        };
      } catch (error) {
        logger.error('Database cleanup failed', {
          jobId: job.id,
          error: error.message,
        });
        throw new Error(`Database cleanup failed: ${error.message}`);
      }
    });

    // Cache cleanup
    this.jobQueue.registerProcessor('cleanup', 'cache-cleanup', async (jobData, job) => {
      const { pattern, maxAge } = jobData;

      try {
        logger.info('Processing cache cleanup', {
          jobId: job.id,
          pattern,
          maxAge,
        });

        // Implementation would clean up old cache entries
        const cleanupResults = {
          pattern,
          entriesRemoved: 500,
          spaceFreed: '50MB',
          processingTime: Date.now() - job.processedOn,
        };

        return {
          success: true,
          cleanupResults,
          processingTime: Date.now() - job.processedOn,
        };
      } catch (error) {
        logger.error('Cache cleanup failed', {
          jobId: job.id,
          error: error.message,
        });
        throw new Error(`Cache cleanup failed: ${error.message}`);
      }
    });

    // Log rotation
    this.jobQueue.registerProcessor('cleanup', 'log-rotation', async (jobData, job) => {
      const { retentionDays, compress } = jobData;

      try {
        logger.info('Processing log rotation', {
          jobId: job.id,
          retentionDays,
          compress,
        });

        // Implementation would rotate and compress old logs
        const rotationResults = {
          logsRotated: 25,
          spaceFreed: '200MB',
          compressed: compress,
          retentionDays,
          processingTime: Date.now() - job.processedOn,
        };

        return {
          success: true,
          rotationResults,
          processingTime: Date.now() - job.processedOn,
        };
      } catch (error) {
        logger.error('Log rotation failed', {
          jobId: job.id,
          error: error.message,
        });
        throw new Error(`Log rotation failed: ${error.message}`);
      }
    });

    logger.info('Cleanup processors registered');
  }

  /**
   * Get registry statistics
   * @returns {Object} Registry statistics
   */
  getStats() {
    return {
      processors: Object.keys(this.processors),
      queues: this.jobQueue ? Array.from(this.jobQueue.queues.keys()) : [],
      initialized: !!this.jobQueue,
    };
  }

  /**
   * Health check for job registry
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      const stats = this.getStats();
      const queueHealth = this.jobQueue ? await this.jobQueue.healthCheck() : null;

      return {
        status: 'healthy',
        service: 'job-registry',
        stats,
        queueHealth,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Job registry health check failed', { error: error.message });
      return {
        status: 'unhealthy',
        service: 'job-registry',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

export default JobRegistry;

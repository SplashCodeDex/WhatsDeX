const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

/**
 * Media Processing Job Handlers
 * Handles background media processing tasks like image optimization, video processing, etc.
 */

class MediaProcessor {
  constructor() {
    this.supportedFormats = {
      images: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff'],
      videos: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'],
      audio: ['mp3', 'wav', 'ogg', 'aac', 'flac']
    };

    this.tempDir = path.join(process.cwd(), 'temp');
    this.outputDir = path.join(process.cwd(), 'processed');

    // Ensure directories exist
    this.ensureDirectories();
  }

  /**
   * Ensure required directories exist
   */
  async ensureDirectories() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
      await fs.mkdir(this.outputDir, { recursive: true });
      logger.debug('Media processing directories ensured');
    } catch (error) {
      logger.error('Failed to create media processing directories', { error: error.message });
    }
  }

  /**
   * Process image optimization job
   * @param {Object} jobData - Job data
   * @param {Object} job - Bull job instance
   * @returns {Promise<Object>} Processing result
   */
  async processImageOptimization(jobData, job) {
    const { imagePath, options, userId } = jobData;

    try {
      logger.info('Processing image optimization', {
        jobId: job.id,
        userId,
        imagePath,
        options
      });

      const inputPath = path.resolve(imagePath);
      const filename = path.basename(inputPath, path.extname(inputPath));
      const outputPath = path.join(this.outputDir, `${filename}_optimized.webp`);

      // Get image metadata
      const metadata = await sharp(inputPath).metadata();

      // Apply optimizations
      let sharpInstance = sharp(inputPath);

      // Resize if specified
      if (options.width || options.height) {
        sharpInstance = sharpInstance.resize(options.width, options.height, {
          fit: options.fit || 'cover',
          withoutEnlargement: options.withoutEnlargement !== false
        });
      }

      // Apply quality/compression
      if (options.quality) {
        sharpInstance = sharpInstance.webp({ quality: options.quality });
      } else {
        sharpInstance = sharpInstance.webp({ quality: 80 }); // Default quality
      }

      // Process the image
      await sharpInstance.toFile(outputPath);

      // Get output file size
      const stats = await fs.stat(outputPath);
      const originalStats = await fs.stat(inputPath);

      const compressionRatio = ((originalStats.size - stats.size) / originalStats.size * 100).toFixed(2);

      logger.info('Image optimization completed', {
        jobId: job.id,
        originalSize: originalStats.size,
        optimizedSize: stats.size,
        compressionRatio: `${compressionRatio}%`,
        outputPath
      });

      return {
        success: true,
        originalPath: inputPath,
        outputPath,
        originalSize: originalStats.size,
        optimizedSize: stats.size,
        compressionRatio: parseFloat(compressionRatio),
        metadata: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format
        },
        processingTime: Date.now() - job.processedOn
      };

    } catch (error) {
      logger.error('Image optimization failed', {
        jobId: job.id,
        userId,
        imagePath,
        error: error.message
      });

      throw new Error(`Image optimization failed: ${error.message}`);
    }
  }

  /**
   * Process batch image processing job
   * @param {Object} jobData - Job data
   * @param {Object} job - Bull job instance
   * @returns {Promise<Object>} Processing result
   */
  async processBatchImageProcessing(jobData, job) {
    const { images, options, userId } = jobData;

    try {
      logger.info('Processing batch image processing', {
        jobId: job.id,
        userId,
        imageCount: images.length,
        options
      });

      const results = [];

      for (let i = 0; i < images.length; i++) {
        const imageData = images[i];

        try {
          const result = await this.processImageOptimization({
            imagePath: imageData.path,
            options: { ...options, ...imageData.options },
            userId
          }, { ...job, id: `${job.id}_${i}` });

          results.push({
            id: imageData.id,
            ...result,
            success: true
          });

        } catch (imageError) {
          logger.warn('Failed to process image in batch', {
            jobId: job.id,
            imageId: imageData.id,
            error: imageError.message
          });

          results.push({
            id: imageData.id,
            error: imageError.message,
            success: false
          });
        }

        // Update job progress
        job.progress((i + 1) / images.length * 100);
      }

      const successful = results.filter(r => r.success).length;

      return {
        success: true,
        totalImages: images.length,
        successful,
        failed: images.length - successful,
        results,
        processingTime: Date.now() - job.processedOn
      };

    } catch (error) {
      logger.error('Batch image processing failed', {
        jobId: job.id,
        userId,
        error: error.message
      });

      throw new Error(`Batch image processing failed: ${error.message}`);
    }
  }

  /**
   * Process video thumbnail generation
   * @param {Object} jobData - Job data
   * @param {Object} job - Bull job instance
   * @returns {Promise<Object>} Processing result
   */
  async processVideoThumbnail(jobData, job) {
    const { videoPath, timestamp, size, userId } = jobData;

    try {
      logger.info('Processing video thumbnail generation', {
        jobId: job.id,
        userId,
        videoPath,
        timestamp,
        size
      });

      // For now, create a placeholder thumbnail
      // In a real implementation, you would use ffmpeg or similar
      const thumbnailPath = path.join(this.outputDir, `${path.basename(videoPath, path.extname(videoPath))}_thumbnail.jpg`);

      // Create a simple colored rectangle as placeholder
      await sharp({
        create: {
          width: size?.width || 320,
          height: size?.height || 180,
          channels: 3,
          background: { r: 100, g: 100, b: 100 }
        }
      })
      .jpeg()
      .toFile(thumbnailPath);

      // Get file sizes
      const videoStats = await fs.stat(videoPath);
      const thumbnailStats = await fs.stat(thumbnailPath);

      return {
        success: true,
        videoPath,
        thumbnailPath,
        videoSize: videoStats.size,
        thumbnailSize: thumbnailStats.size,
        timestamp: timestamp || 0,
        size: {
          width: size?.width || 320,
          height: size?.height || 180
        },
        processingTime: Date.now() - job.processedOn
      };

    } catch (error) {
      logger.error('Video thumbnail generation failed', {
        jobId: job.id,
        userId,
        videoPath,
        error: error.message
      });

      throw new Error(`Video thumbnail generation failed: ${error.message}`);
    }
  }

  /**
   * Process file format conversion
   * @param {Object} jobData - Job data
   * @param {Object} job - Bull job instance
   * @returns {Promise<Object>} Processing result
   */
  async processFileConversion(jobData, job) {
    const { inputPath, outputFormat, options, userId } = jobData;

    try {
      logger.info('Processing file conversion', {
        jobId: job.id,
        userId,
        inputPath,
        outputFormat,
        options
      });

      const inputExt = path.extname(inputPath).toLowerCase().slice(1);
      const filename = path.basename(inputPath, path.extname(inputPath));
      const outputPath = path.join(this.outputDir, `${filename}.${outputFormat}`);

      if (this.supportedFormats.images.includes(inputExt) &&
          this.supportedFormats.images.includes(outputFormat)) {

        // Image format conversion
        let sharpInstance = sharp(inputPath);

        // Apply conversion options
        switch (outputFormat) {
          case 'webp':
            sharpInstance = sharpInstance.webp(options);
            break;
          case 'png':
            sharpInstance = sharpInstance.png(options);
            break;
          case 'jpg':
          case 'jpeg':
            sharpInstance = sharpInstance.jpeg(options);
            break;
          default:
            sharpInstance = sharpInstance.toFormat(outputFormat, options);
        }

        await sharpInstance.toFile(outputPath);

      } else {
        // For unsupported conversions, just copy the file
        await fs.copyFile(inputPath, outputPath);
        logger.warn('Unsupported conversion, file copied as-is', {
          jobId: job.id,
          inputFormat: inputExt,
          outputFormat
        });
      }

      // Get file sizes
      const inputStats = await fs.stat(inputPath);
      const outputStats = await fs.stat(outputPath);

      return {
        success: true,
        inputPath,
        outputPath,
        inputFormat: inputExt,
        outputFormat,
        inputSize: inputStats.size,
        outputSize: outputStats.size,
        processingTime: Date.now() - job.processedOn
      };

    } catch (error) {
      logger.error('File conversion failed', {
        jobId: job.id,
        userId,
        inputPath,
        outputFormat,
        error: error.message
      });

      throw new Error(`File conversion failed: ${error.message}`);
    }
  }

  /**
   * Process media cleanup job
   * @param {Object} jobData - Job data
   * @param {Object} job - Bull job instance
   * @returns {Promise<Object>} Processing result
   */
  async processMediaCleanup(jobData, job) {
    const { olderThan, patterns, userId } = jobData;

    try {
      logger.info('Processing media cleanup', {
        jobId: job.id,
        userId,
        olderThan,
        patterns
      });

      const cutoffTime = Date.now() - (olderThan * 60 * 60 * 1000); // Convert hours to milliseconds
      let deletedCount = 0;
      let freedSpace = 0;

      // Clean temp directory
      const tempFiles = await fs.readdir(this.tempDir);
      for (const file of tempFiles) {
        const filePath = path.join(this.tempDir, file);
        const stats = await fs.stat(filePath);

        if (stats.mtime.getTime() < cutoffTime) {
          // Check if file matches cleanup patterns
          const shouldDelete = !patterns || patterns.some(pattern =>
            file.includes(pattern) || file.match(new RegExp(pattern))
          );

          if (shouldDelete) {
            await fs.unlink(filePath);
            deletedCount++;
            freedSpace += stats.size;

            logger.debug('Cleaned up temp file', {
              jobId: job.id,
              file,
              size: stats.size,
              age: (Date.now() - stats.mtime.getTime()) / (60 * 60 * 1000)
            });
          }
        }
      }

      // Clean processed directory (be more conservative)
      const processedFiles = await fs.readdir(this.outputDir);
      for (const file of processedFiles) {
        const filePath = path.join(this.outputDir, file);
        const stats = await fs.stat(filePath);

        // Only delete very old processed files (7 days)
        const processedCutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
        if (stats.mtime.getTime() < processedCutoff) {
          await fs.unlink(filePath);
          deletedCount++;
          freedSpace += stats.size;

          logger.debug('Cleaned up processed file', {
            jobId: job.id,
            file,
            size: stats.size
          });
        }
      }

      return {
        success: true,
        deletedFiles: deletedCount,
        freedSpace,
        tempDir: this.tempDir,
        outputDir: this.outputDir,
        processingTime: Date.now() - job.processedOn
      };

    } catch (error) {
      logger.error('Media cleanup failed', {
        jobId: job.id,
        userId,
        error: error.message
      });

      throw new Error(`Media cleanup failed: ${error.message}`);
    }
  }

  /**
   * Process media analytics job
   * @param {Object} jobData - Job data
   * @param {Object} job - Bull job instance
   * @returns {Promise<Object>} Processing result
   */
  async processMediaAnalytics(jobData, job) {
    const { timeRange, userId } = jobData;

    try {
      logger.info('Processing media analytics', {
        jobId: job.id,
        userId,
        timeRange
      });

      // This would analyze media processing metrics
      // For now, return mock analytics data
      const analytics = {
        totalProcessed: 1250,
        imagesOptimized: 890,
        videosProcessed: 120,
        storageUsed: '2.5GB',
        averageProcessingTime: 3.2,
        successRate: 97.8,
        popularFormats: ['jpg', 'png', 'mp4'],
        timeRange,
        generatedAt: new Date().toISOString()
      };

      return {
        success: true,
        analytics,
        processingTime: Date.now() - job.processedOn
      };

    } catch (error) {
      logger.error('Media analytics processing failed', {
        jobId: job.id,
        userId,
        error: error.message
      });

      throw new Error(`Media analytics processing failed: ${error.message}`);
    }
  }

  /**
   * Get supported formats
   * @returns {Object} Supported formats
   */
  getSupportedFormats() {
    return this.supportedFormats;
  }

  /**
   * Check if file format is supported
   * @param {string} filename - Filename to check
   * @param {string} type - Type of media (images, videos, audio)
   * @returns {boolean} Whether format is supported
   */
  isFormatSupported(filename, type = 'images') {
    const ext = path.extname(filename).toLowerCase().slice(1);
    return this.supportedFormats[type]?.includes(ext) || false;
  }
}

module.exports = MediaProcessor;
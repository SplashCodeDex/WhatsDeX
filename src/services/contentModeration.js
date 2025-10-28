const GeminiService = require('../../services/gemini');
const logger = require('../utils/logger');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class ContentModerationService {
  constructor() {
    this.gemini = new GeminiService();
    this.settings = {};
    this.loadSettings();
  }

  async loadSettings() {
    const dbSettings = await prisma.systemSetting.findMany({
      where: { category: 'moderation' },
    });

    this.settings = dbSettings.reduce((acc, setting) => {
      acc[setting.key] = this._parseValue(setting.value, setting.valueType);
      return acc;
    }, {});

    logger.info('Content moderation settings loaded from database', this.settings);
  }

  async moderateContent(content, context = {}) {
    if (!this.settings.contentModerationEnabled || !content) {
      return { safe: true, score: 0, categories: [] };
    }

    try {
      const moderationResult = await this.gemini.moderateContent(content);
      const enhancedResult = await this.enhanceModeration(content, moderationResult, context);

      if (!enhancedResult.safe) {
        logger.warn('Content flagged by moderation', {
          userId: context.userId,
          categories: enhancedResult.categories,
          score: enhancedResult.score,
        });
      }

      return enhancedResult;
    } catch (error) {
      logger.error('Content moderation failed', { error: error.message });
      return { safe: true, score: 0, categories: [], reason: 'Moderation service unavailable' };
    }
  }

  async enhanceModeration(content, aiResult, context) {
    const enhanced = { ...aiResult };
    const patternChecks = this.performPatternChecks(content);

    enhanced.categories = [...new Set([...(enhanced.categories || []), ...patternChecks.categories])];
    enhanced.score = Math.max(enhanced.score || 0, patternChecks.score);

    if (context.userId) {
      enhanced.score = await this.adjustForUserHistory(enhanced.score, context.userId);
    }

    enhanced.safe = this.determineSafety(enhanced.score, enhanced.categories);
    return enhanced;
  }

  performPatternChecks(content) {
    // This part can remain as it is, since it's rule-based
    const lowerContent = content.toLowerCase();
    const categories = [];
    let score = 0;
    const hatePatterns = [/\b(nigger|nigga)\b/i, /\b(faggot|fag)\b/i];
    const violencePatterns = [/\b(kill|murder)\b.*\b(you|him|her)\b/i, /\b(bomb|explode)\b/i];

    if (hatePatterns.some(p => p.test(lowerContent))) {
      categories.push('hate_speech');
      score = Math.max(score, 0.9);
    }
    if (violencePatterns.some(p => p.test(lowerContent))) {
      categories.push('violence');
      score = Math.max(score, 0.8);
    }

    return { categories, score };
  }

  async adjustForUserHistory(score, userId) {
    const violationCount = await prisma.userViolation.count({
      where: {
        userId,
        createdAt: {
          gte: new Date(new Date() - 30 * 24 * 60 * 60 * 1000), // last 30 days
        },
      },
    });

    // Increase score by 10% for each recent violation
    return score * (1 + violationCount * 0.1);
  }

  determineSafety(score, categories) {
    const alwaysBlock = ['hate_speech', 'violence', 'self_harm'];
    if (categories.some(cat => alwaysBlock.includes(cat))) {
      return false;
    }

    const threshold = this.settings.strictMode ? this.settings.moderationThresholdStrict : this.settings.moderationThreshold;
    return score < threshold;
  }

  async getStatistics() {
    const totalModerated = await prisma.moderationQueue.count();
    const blockedContent = await prisma.moderationQueue.count({ where: { status: 'rejected' } });

    // This is a simplified version. A real implementation would need more detailed logging.
    return {
      totalModerated,
      blockedContent,
      lastUpdated: new Date().toISOString(),
    };
  }

  async reportFeedback(content, moderationResult, isCorrect, feedback) {
    // Storing feedback could be implemented here, e.g., in a new `ModerationFeedback` model
    logger.info('Moderation feedback received', {
      content: content.substring(0, 50),
      isCorrect,
      feedback,
    });
  }

  _parseValue(value, type) {
    switch (type) {
      case 'number':
        return Number(value);
      case 'boolean':
        return value === 'true';
      default:
        return value;
    }
  }
}

module.exports = ContentModerationService;

/**
 * Services Manager - Initialize and manage all services
 * Ensures proper initialization of all services with error handling
 */

const gamesService = require('./gamesServiceFixed');
const funCommandsService = require('./funCommandsService');
const stickerService = require('./stickerService');
const enhancedDownloadersService = require('./enhancedDownloadersService');
const menfesService = require('./menfesService');
const mathQuizService = require('./mathQuizService');
const textToSpeechService = require('./textToSpeechService');
const writingService = require('./writingService');
const multiBotService = require('./multiBotService');

class ServicesManager {
  constructor() {
    this.initialized = false;
    this.services = {};
  }

  /**
   * Initialize all services
   */
  async initialize() {
    try {
      console.log('🔄 Initializing services...');

      // Initialize services in order
      await this.initializeService('funCommands', async () => {
        await funCommandsService.initialize();
        return funCommandsService;
      });

      await this.initializeService('textToSpeech', async () => {
        await textToSpeechService.initialize();
        return textToSpeechService;
      });

      await this.initializeService('writing', async () => {
        await writingService.initialize();
        return writingService;
      });

      await this.initializeService('multiBot', async () => {
        await multiBotService.initialize();
        return multiBotService;
      });

      // Initialize other services
      this.services.games = gamesService;
      this.services.sticker = stickerService;
      this.services.enhancedDownloaders = enhancedDownloadersService;
      this.services.menfes = menfesService;
      this.services.mathQuiz = mathQuizService;

      // Set up cleanup intervals
      this.setupCleanupIntervals();

      this.initialized = true;
      console.log('✅ All services initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing services:', error);
      throw error;
    }
  }

  /**
   * Initialize individual service
   * @param {string} name - Service name
   * @param {Function} initFunction - Initialization function
   */
  async initializeService(name, initFunction) {
    try {
      console.log(`🔄 Initializing ${name} service...`);
      this.services[name] = await initFunction();
      console.log(`✅ ${name} service initialized`);
    } catch (error) {
      console.error(`❌ Error initializing ${name} service:`, error);
      throw error;
    }
  }

  /**
   * Set up cleanup intervals for services
   */
  setupCleanupIntervals() {
    // Clean up games every 5 minutes
    setInterval(
      () => {
        try {
          gamesService.cleanupInactiveGames();
        } catch (error) {
          console.error('Error cleaning up games:', error);
        }
      },
      5 * 60 * 1000
    );

    // Clean up menfes sessions every 2 minutes
    setInterval(
      () => {
        try {
          menfesService.cleanup();
        } catch (error) {
          console.error('Error cleaning up menfes:', error);
        }
      },
      2 * 60 * 1000
    );

    // Clean up downloaders sessions every 10 minutes
    setInterval(
      () => {
        try {
          enhancedDownloadersService.cleanupOldSessions();
        } catch (error) {
          console.error('Error cleaning up downloaders:', error);
        }
      },
      10 * 60 * 1000
    );

    // Clean up sticker temp files every hour
    setInterval(
      () => {
        try {
          stickerService.cleanupTempFiles();
        } catch (error) {
          console.error('Error cleaning up sticker files:', error);
        }
      },
      60 * 60 * 1000
    );

    // Clean up math quizzes every 3 minutes
    setInterval(
      () => {
        try {
          mathQuizService.cleanupInactiveQuizzes();
        } catch (error) {
          console.error('Error cleaning up math quizzes:', error);
        }
      },
      3 * 60 * 1000
    );

    // Clean up TTS files every 30 minutes
    setInterval(
      () => {
        try {
          textToSpeechService.cleanupOldFiles();
        } catch (error) {
          console.error('Error cleaning up TTS files:', error);
        }
      },
      30 * 60 * 1000
    );

    // Clean up writing files every 45 minutes
    setInterval(
      () => {
        try {
          writingService.cleanupOldFiles();
        } catch (error) {
          console.error('Error cleaning up writing files:', error);
        }
      },
      45 * 60 * 1000
    );

    // Clean up inactive multi-bots every 15 minutes
    setInterval(
      () => {
        try {
          multiBotService.cleanupInactiveBots();
        } catch (error) {
          console.error('Error cleaning up multi-bots:', error);
        }
      },
      15 * 60 * 1000
    );
  }

  /**
   * Get service instance
   * @param {string} name - Service name
   */
  getService(name) {
    if (!this.initialized) {
      throw new Error('Services not initialized. Call initialize() first.');
    }

    const service = this.services[name];
    if (!service) {
      throw new Error(`Service '${name}' not found`);
    }

    return service;
  }

  /**
   * Check if services are initialized
   */
  isInitialized() {
    return this.initialized;
  }

  /**
   * Get initialization status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      services: Object.keys(this.services),
      activeGames: gamesService.getActiveGamesCount(),
      activeMenfes: menfesService.getActiveSessionsCount(),
      activeBots: multiBotService.getStats().activeBots,
    };
  }
}

// Export singleton instance
module.exports = new ServicesManager();

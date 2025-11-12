import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import pino from 'pino';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, rmSync } from 'node:fs';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
// Robust reconnection manager with circuit breaker
class ConnectionManager {
  constructor(config = {}) {
    this.state = {
      isReconnecting: false,
      attemptCount: 0,
      consecutiveFailures: 0,
      lastError: null,
      lastSuccessTime: Date.now(),
      maxRetries: config.maxRetries || 10,
      baseDelay: config.baseDelay || 2000,
      maxDelay: config.maxDelay || 300000,
      backoffMultiplier: config.backoffMultiplier || 1.5,
      circuitBreakerThreshold: config.circuitBreakerThreshold || 5,
      circuitBreakerTimeout: config.circuitBreakerTimeout || 600000 // 10 minutes
    };
    this.reconnectionTimeout = null;
  }

  async handleReconnection(error, context) {
    // Circuit breaker check
    if (this.isCircuitOpen()) {
      console.log('⚡ Circuit breaker OPEN - waiting before retry');
      await this.waitForCircuitReset();
    }

    // Check max retries BEFORE incrementing
    if (this.state.attemptCount >= this.state.maxRetries) {
      console.error('💀 Max reconnection attempts reached. Manual intervention required.');
      throw new Error(`Connection failed after ${this.state.maxRetries} attempts`);
    }

    // Increment attempt count
    this.state.attemptCount++;
    this.state.consecutiveFailures++;
    this.state.isReconnecting = true;
    this.state.lastError = error;

    const delay = this.calculateBackoffDelay();
    
    // Show correct attempt numbers
    console.log(`🔄 Reconnection attempt ${this.state.attemptCount}/${this.state.maxRetries} in ${Math.round(delay)}ms`);
    console.log(`❌ Last error: ${error?.message || 'Unknown'}`);
    console.log(`📊 Total failures: ${this.state.consecutiveFailures}, Success rate: ${((this.state.attemptCount - this.state.consecutiveFailures) / this.state.attemptCount * 100).toFixed(1)}%`);

    // Clear any existing timeout
    if (this.reconnectionTimeout) {
      clearTimeout(this.reconnectionTimeout);
    }

    try {
      // Wait with proper delay
      await new Promise(resolve => {
        this.reconnectionTimeout = setTimeout(resolve, delay);
      });

      console.log(`⚡ Executing reconnection attempt ${this.state.attemptCount}...`);
      
      // Try reconnection
      await this.attemptReconnection(context);
      
      // Reset state on success
      this.onReconnectionSuccess();

    } catch (reconnectionError) {
      console.error(`🔥 Reconnection attempt ${this.state.attemptCount} failed:`, reconnectionError.message);
      
      // Check if we should continue trying
      if (this.state.attemptCount < this.state.maxRetries) {
        console.log(`🔄 Will retry... (${this.state.maxRetries - this.state.attemptCount} attempts remaining)`);
        return this.handleReconnection(reconnectionError, context);
      } else {
        this.onReconnectionFailure();
        throw reconnectionError;
      }
    }
  }

  async attemptReconnection(context) {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Reconnection timeout'));
      }, 30000); // 30 second timeout

      try {
        // Clean up previous bot instance if exists
        if (global.bot) {
          try {
            global.bot.ev.removeAllListeners();
            if (global.bot.ws) {
              global.bot.ws.close();
            }
            global.bot = null;
          } catch (cleanupError) {
            console.warn('⚠️  Cleanup warning:', cleanupError.message);
          }
        }

        // Create new bot instance directly instead of calling main recursively
        const newBot = await this.createBotInstance(context);
        global.bot = newBot;
        
        clearTimeout(timeout);
        resolve(newBot);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  async createBotInstance(context) {
    const { config } = context;
    const path = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const { useMultiFileAuthState, makeWASocket, DisconnectReason } = await import('@whiskeysockets/baileys');
    const pino = (await import('pino')).default;

    const authDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), config.bot.authAdapter.default.authDir);
    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    const logger = pino({ level: 'silent' });

    const bot = makeWASocket({
      auth: state,
      logger,
      browser: config.bot.browser,
      defaultQueryTimeoutMs: 60000,
      retryRequestDelayMs: 250,
      maxMsgRetryCount: 5,
      keepAliveIntervalMs: 30000
    });

    bot.ev.on('creds.update', saveCreds);
    
    // Set up basic event handlers for the new instance
    this.setupBotEventHandlers(bot, context);
    
    return bot;
  }

  setupBotEventHandlers(bot, context) {
    // Set up connection monitoring
    bot.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect } = update;
      
      if (connection === 'close') {
        this.state.lastDisconnected = Date.now();
        const error = lastDisconnect?.error;
        console.log(`❌ Bot connection closed: ${error?.message || 'Unknown error'}`);
        
        // Let the main connection handler in main() deal with reconnection
        // This is just for tracking
      } else if (connection === 'open') {
        console.log('✅ Bot reconnected successfully!');
        global.bot = bot;
      }
    });
  }

  calculateBackoffDelay() {
    const exponentialDelay = this.state.baseDelay * Math.pow(this.state.backoffMultiplier, this.state.attemptCount - 1);
    const jitterDelay = exponentialDelay * (0.5 + Math.random() * 0.5); // Add jitter
    return Math.min(jitterDelay, this.state.maxDelay);
  }

  isCircuitOpen() {
    return this.state.consecutiveFailures >= this.state.circuitBreakerThreshold &&
           (Date.now() - this.state.lastSuccessTime) > this.state.circuitBreakerTimeout;
  }

  async waitForCircuitReset() {
    const waitTime = Math.min(
      this.state.circuitBreakerTimeout - (Date.now() - this.state.lastSuccessTime),
      300000 // Max 5 minutes
    );
    
    if (waitTime > 0) {
      console.log(`⏳ Circuit breaker cooling down for ${Math.round(waitTime/1000)}s`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  onReconnectionSuccess() {
    const totalAttempts = this.state.attemptCount;
    const reconnectionTime = this.state.lastDisconnected ? 
      Date.now() - this.state.lastDisconnected : 0;
    
    console.log(`✅ Reconnection successful after ${totalAttempts} attempts`);
    if (reconnectionTime > 0) {
      console.log(`⏱️  Total reconnection time: ${Math.round(reconnectionTime/1000)}s`);
    }
    
    // Track statistics before resetting
    this.state.totalSuccessfulReconnections = (this.state.totalSuccessfulReconnections || 0) + 1;
    this.state.totalReconnectionTime = (this.state.totalReconnectionTime || 0) + reconnectionTime;
    
    // Reset reconnection state
    this.state.isReconnecting = false;
    this.state.attemptCount = 0;
    this.state.consecutiveFailures = 0;
    this.state.lastError = null;
    this.state.lastSuccessTime = Date.now();
    
    if (this.reconnectionTimeout) {
      clearTimeout(this.reconnectionTimeout);
      this.reconnectionTimeout = null;
    }
    
    // Log success statistics
    const avgReconnectionTime = this.state.totalReconnectionTime / this.state.totalSuccessfulReconnections;
    console.log(`📈 Reconnection stats: ${this.state.totalSuccessfulReconnections} successful, avg time: ${Math.round(avgReconnectionTime/1000)}s`);
  }

  onReconnectionFailure() {
    console.error('💀 All reconnection attempts failed');
    this.state.isReconnecting = false;
    
    if (this.reconnectionTimeout) {
      clearTimeout(this.reconnectionTimeout);
      this.reconnectionTimeout = null;
    }
  }

  getStatus() {
    return {
      ...this.state,
      circuitOpen: this.isCircuitOpen(),
      nextRetryIn: this.reconnectionTimeout ? 'Pending' : 'None'
    };
  }
}

const connectionManager = new ConnectionManager({
  maxRetries: 15,
  baseDelay: 3000,
  circuitBreakerThreshold: 5,
  circuitBreakerTimeout: 600000
});

import { jobResultsQueue } from './lib/queues.js';

const main = async context => {
  const { config } = context;
  
  // Validate critical configuration
  if (!config?.bot?.authAdapter?.default?.authDir) {
    throw new Error('Missing critical configuration: config.bot.authAdapter.default.authDir');
  }

  // Add comprehensive error handling wrapper
  try {

  // Reset reconnection state on successful main() call
  if (connectionManager.state.isReconnecting) {
    connectionManager.onReconnectionSuccess();
  }

  const authDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), config.bot.authAdapter.default.authDir);
  
  // Ensure auth directory exists
  if (!existsSync(authDir)) {
    console.log(`📁 Creating auth directory: ${authDir}`);
    try {
      const fs = await import('node:fs/promises');
      await fs.mkdir(authDir, { recursive: true });
    } catch (dirError) {
      console.error(`❌ Failed to create auth directory: ${dirError.message}`);
      throw new Error(`Auth directory setup failed: ${dirError.message}`);
    }
  }
  
  const { state, saveCreds } = await useMultiFileAuthState(authDir);

  const logger = pino({
    level: 'silent',
  });

  const bot = makeWASocket({
    auth: state,
    logger,
    browser: config.bot.browser,
    defaultQueryTimeoutMs: 60000, // 60 seconds timeout
    retryRequestDelayMs: 250,
    maxMsgRetryCount: 5,
    keepAliveIntervalMs: 30000 // 30 seconds keep-alive
  });

  // Listen for job results from the worker
  jobResultsQueue.process(async (job) => {
    const { userJid, imageUrl, input, used, success, error } = job.data;
    const { formatter } = context;

    try {
      if (success) {
        console.log(`✅ Sending completed job result to ${userJid}`);
        await bot.sendMessage(userJid, {
          image: {
            url: imageUrl,
          },
          mimetype: 'image/png',
          caption: formatter.quote(`Prompt: ${input}`),
          footer: config.msg.footer,
          buttons: [
            {
              buttonId: `${used.prefix}${used.command} ${input}`,
              buttonText: {
                displayText: 'Ambil Lagi',
              },
            },
          ],
        });
      } else {
        console.error(`❌ Job failed for ${userJid}. Reason: ${error}`);
        await bot.sendMessage(userJid, {
          text: `Maaf, terjadi kesalahan saat membuat gambar: ${error}`,
        });
      }
    } catch (e) {
      console.error(`❌ Failed to send job result message to ${userJid}:`, e);
    }
  });


  bot.ev.on('creds.update', saveCreds);

  // Add WebSocket error handling
  bot.ev.on('CB:stream-error', (streamError) => {
    console.error('🌊 WebSocket stream error detected:', streamError);
    if (streamError?.attrs?.code === '515') {
      console.log('🔧 Stream error code 515 - Connection will be restarted');
    }
  });

  // Monitor connection quality
  bot.ev.on('CB:call', (call) => {
    if (call?.attrs?.type === 'error') {
      console.warn('📞 Call error detected:', call);
    }
  });

  // Add message send error handling
  bot.ev.on('CB:receipt', (receipt) => {
    if (receipt?.attrs?.type === 'error') {
      console.warn('📧 Message receipt error:', receipt);
    }
  });

  bot.ev.on('connection.update', async update => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('📱 Generating QR Code...');
      try {
        // Generate QR for terminal
        qrcode.generate(qr, { small: true });
        console.log('✅ QR Code generated in terminal.');

        // Emit QR to web dashboard
        if (global.io) {
          global.io.emit('qr-code-update', {
            qr: qr,
            timestamp: Date.now(),
            status: 'qr_ready'
          });
          console.log('✅ QR Code emitted to web interface.');
        }
        
        // Store QR for web API access
        global.currentQR = {
          code: qr,
          timestamp: Date.now(),
          status: 'ready'
        };

      } catch (e) {
        console.error('❌ Failed to generate or broadcast QR code:', e.message);
      }
    }

    if (connection === 'close') {
      // Track disconnection time for statistics
      connectionManager.state.lastDisconnected = Date.now();
      
      const error = lastDisconnect?.error;
      let shouldReconnect = true;
      let errorCode = 'unknown';
      let errorMessage = 'Unknown error';

      // Enhanced error analysis
      if (error instanceof Boom) {
        errorCode = error.output?.statusCode;
        errorMessage = error.message || error.output?.payload?.message || 'Boom error';
        
        // Check against actual DisconnectReason values
        shouldReconnect = errorCode !== DisconnectReason.loggedOut && 
                         errorCode !== DisconnectReason.forbidden;
      } else if (error) {
        errorMessage = error.message || 'Generic error';
        errorCode = error.code || error.statusCode || 'unknown';
      }

      console.log(`❌ Connection closed: ${errorMessage} (Code: ${errorCode})`);
      
      // Map known error codes to readable descriptions
      const errorDescriptions = {
        [DisconnectReason.connectionClosed]: 'Connection closed by WhatsApp (428)',
        [DisconnectReason.connectionLost]: 'Connection lost/timed out (408)', 
        [DisconnectReason.connectionReplaced]: 'Connection replaced by another session (440)',
        [DisconnectReason.loggedOut]: 'Account logged out (401)',
        [DisconnectReason.restartRequired]: 'WhatsApp restart required (515)',
        [DisconnectReason.badSession]: 'Bad session data (500)',
        [DisconnectReason.multideviceMismatch]: 'Multi-device mismatch (411)',
        [DisconnectReason.forbidden]: 'Access forbidden (403)',
        [DisconnectReason.unavailableService]: 'WhatsApp service unavailable (503)',
        405: 'Method not allowed - likely session/auth issue (405)'
      };

      if (errorDescriptions[errorCode]) {
        console.log(`🔍 Error details: ${errorDescriptions[errorCode]}`);
      }

      // Special handling for specific error codes
      if (errorCode === 405) {
        console.log('⚠️  HTTP 405 detected - this suggests session/authentication issues');
        console.log('🔧 Clearing session and forcing fresh authentication...');
        shouldReconnect = true;
        
        // Clear session data for 405 errors
        try {
          const authDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), context.config.bot.authAdapter.default.authDir);
          if (existsSync(authDir)) {
            rmSync(authDir, { recursive: true, force: true });
            console.log('✅ Session cleared - will generate new QR code');
          }
        } catch (clearError) {
          console.warn('⚠️  Could not clear session:', clearError.message);
        }
      }

      if (shouldReconnect) {
        // Ensure reconnection attempt counter is properly tracked
        console.log(`🔄 Initiating reconnection (Attempt will be: ${connectionManager.state.attemptCount + 1}/${connectionManager.state.maxRetries})`);
        await connectionManager.handleReconnection(error, context);
      } else {
        console.log(`🛑 Bot logged out or forbidden - manual intervention required (Code: ${errorCode})`);
      }
    } else if (connection === 'open') {
      console.log('✅ Bot connected to WhatsApp!');
      console.log('Bot JID:', bot.user.id);
      global.bot = bot;
      
      // CONSOLIDATED: Single connection success handler with all features
      if (global.io) {
        global.io.emit('connection-status', {
          status: 'connected',
          timestamp: Date.now(),
          message: 'WhatsApp connected successfully'
        });
      }
      
      // Clear QR code data - sophisticated state management
      global.currentQR = {
        code: null,
        timestamp: Date.now(),
        status: 'connected'
      };
    } else if (connection === 'connecting') {
      console.log('🔄 Connecting to WhatsApp...');
    }
    // REMOVED: Duplicate 'connection === open' handler eliminated
  });

  // Initialize commands map
  bot.cmd = new Map();
  
  // CONSOLIDATED: Initialize Unified Command System (replaces all command loaders)
  const { UnifiedCommandSystem } = await import('./src/services/UnifiedCommandSystem.js');
  const commandSystem = new UnifiedCommandSystem(bot, context);
  
  try {
    await commandSystem.loadCommands();
    console.log(`✅ Unified Command System loaded: ${commandSystem.getStats().totalCommands} commands`);
    console.log(`📂 Categories: ${commandSystem.getAllCategories().join(', ')}`);
  } catch (commandLoadError) {
    console.error(`❌ Failed to load commands: ${commandLoadError.message}`);
    console.warn('⚠️ Continuing without command system...');
  }
  
  // Maintain compatibility
  bot.cmd = commandSystem.commands;

  // CONSOLIDATED: Initialize Unified AI Processor (replaces multiple AI systems)
  let unifiedAI = null;
  try {
    const { UnifiedAIProcessor } = await import('./src/services/UnifiedAIProcessor.js');
    unifiedAI = new UnifiedAIProcessor(bot, context);
    console.log('✅ Unified AI Processor initialized');
  } catch (aiLoadError) {
    console.error(`❌ Failed to load AI processor: ${aiLoadError.message}`);
    console.warn('⚠️ Continuing without AI processing...');
  }
  
  bot.ev.on('messages.upsert', async m => {
    // Safety check for messages array
    if (!m?.messages || m.messages.length === 0) return;
    
    const msg = m.messages[0];
    if (!msg?.message || !msg?.key) return;
    if (msg.key.fromMe) return; // Ignore own messages

    // Enhanced serialization for intelligent processing
    const messageKeys = Object.keys(msg.message || {});
    const intelligentMsg = {
      key: {
        remoteJid: msg.key.remoteJid,
        fromMe: msg.key.fromMe,
        id: msg.key.id,
      },
      message: msg.message,
      type: messageKeys.length > 0 ? messageKeys[0] : 'unknown',
      pushName: msg.pushName,
      messageTimestamp: msg.messageTimestamp,
      // Add additional context for AI processing
      intelligentContext: {
        receivedAt: Date.now(),
        processingMode: 'intelligent',
        aiEnabled: true
      }
    };

    // CONSOLIDATED: Smart routing between commands and AI
    let isCommand = false;
    
    try {
      if (commandSystem?.processMessage) {
        isCommand = await commandSystem.processMessage(intelligentMsg);
      }
    } catch (commandError) {
      console.error('Command processing error:', commandError.message);
    }
    
    if (!isCommand) {
      // Only process with AI if it's not a command (smart filtering)
      try {
        if (unifiedAI?.processMessage) {
          await unifiedAI.processMessage(intelligentMsg);
        }
      } catch (error) {
        console.error('Unified AI processing error:', error.message);
      }
    }
  });

  return bot;

  } catch (error) {
    console.error('💀 Critical error in main function:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Determine if error is recoverable
    const isRecoverable = !error.message.includes('EADDRINUSE') && 
                         !error.message.includes('FATAL') &&
                         !error.message.includes('Cannot find module');
    
    if (isRecoverable && !connectionManager.state.isReconnecting) {
      console.log('🔄 Attempting recovery from critical error...');
      throw error; // Let connection manager handle it
    } else {
      console.error('💀 Non-recoverable error or already reconnecting');
      process.exit(1);
    }
  }
};


export default main;

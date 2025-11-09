import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import pino from 'pino';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import messageQueue from './src/worker.js';
import IntelligentMessageProcessor from './src/IntelligentMessageProcessor.js';
// Robust reconnection manager with circuit breaker
class ConnectionManager {
  constructor() {
    this.state = {
      isReconnecting: false,
      attemptCount: 0,
      consecutiveFailures: 0,
      lastError: null,
      lastSuccessTime: Date.now(),
      maxRetries: 10,
      baseDelay: 2000,
      maxDelay: 300000,
      backoffMultiplier: 1.5,
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 600000 // 10 minutes
    };
    this.reconnectionTimeout = null;
  }

  async handleReconnection(error, context) {
    // Circuit breaker check
    if (this.isCircuitOpen()) {
      console.log('⚡ Circuit breaker OPEN - waiting before retry');
      await this.waitForCircuitReset();
    }

    if (this.state.attemptCount >= this.state.maxRetries) {
      console.error('💀 Max reconnection attempts reached. Manual intervention required.');
      throw new Error(`Connection failed after ${this.state.maxRetries} attempts`);
    }

    this.state.isReconnecting = true;
    this.state.attemptCount++;
    this.state.consecutiveFailures++;
    this.state.lastError = error;

    const delay = this.calculateBackoffDelay();
    console.log(`🔄 Reconnection attempt ${this.state.attemptCount}/${this.state.maxRetries} in ${delay}ms`);
    console.log(`❌ Last error: ${error?.message || 'Unknown'}`);

    // Clear any existing timeout
    if (this.reconnectionTimeout) {
      clearTimeout(this.reconnectionTimeout);
    }

    try {
      await new Promise(resolve => {
        this.reconnectionTimeout = setTimeout(resolve, delay);
      });

      // Try reconnection
      await this.attemptReconnection(context);
      
      // Reset state on success
      this.onReconnectionSuccess();

    } catch (reconnectionError) {
      console.error(`🔥 Reconnection attempt ${this.state.attemptCount} failed:`, reconnectionError.message);
      
      if (this.state.attemptCount < this.state.maxRetries) {
        return this.handleReconnection(reconnectionError, context);
      } else {
        this.onReconnectionFailure();
        throw reconnectionError;
      }
    }
  }

  async attemptReconnection(context) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Reconnection timeout'));
      }, 30000); // 30 second timeout

      main(context)
        .then(() => {
          clearTimeout(timeout);
          resolve();
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
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
    console.log(`✅ Reconnection successful after ${this.state.attemptCount} attempts`);
    this.state.isReconnecting = false;
    this.state.attemptCount = 0;
    this.state.consecutiveFailures = 0;
    this.state.lastError = null;
    this.state.lastSuccessTime = Date.now();
    
    if (this.reconnectionTimeout) {
      clearTimeout(this.reconnectionTimeout);
      this.reconnectionTimeout = null;
    }
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

const connectionManager = new ConnectionManager();

const main = async context => {
  const { config } = context;

  // Add comprehensive error handling wrapper
  try {

  // Reset reconnection state on successful main() call
  if (connectionManager.state.isReconnecting) {
    connectionManager.onReconnectionSuccess();
  }

  const authDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), config.bot.authAdapter.default.authDir);
  const { state, saveCreds } = await useMultiFileAuthState(authDir);

  const logger = pino({
    level: 'silent',
  });

  const bot = makeWASocket({
    auth: state,
    logger,
    browser: ['WhatsDeX', 'Chrome', '1.0.0'],
    defaultQueryTimeoutMs: 60000, // 60 seconds timeout
    retryRequestDelayMs: 250,
    maxMsgRetryCount: 5,
    keepAliveIntervalMs: 30000 // 30 seconds keep-alive
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
      // OPTIMIZED: Async QR generation to prevent blocking
      Promise.all([
        // Terminal QR generation (async)
        new Promise((resolve) => {
          setImmediate(() => {
            qrcode.generate(qr, { small: true });
            resolve();
          });
        }),
        
        // Web dashboard integration (async)
        new Promise((resolve) => {
          if (global.io) {
            global.io.emit('qr-code-update', {
              qr: qr,
              timestamp: Date.now(),
              status: 'qr_ready'
            });
          }
          
          // Store QR for web API access
          global.currentQR = {
            code: qr,
            timestamp: Date.now(),
            status: 'ready'
          };
          
          resolve();
        })
      ]).then(() => {
        console.log('📱 QR Code generated for all interfaces (async)');
      }).catch(error => {
        console.error('QR generation error:', error.message);
      });
    }

    if (connection === 'close') {
      const error = lastDisconnect?.error;
      const shouldReconnect = error instanceof Boom
        ? error.output.statusCode !== DisconnectReason.loggedOut
        : true;

      // Enhanced error logging with specific handling for stream errors
      if (error) {
        const errorCode = error.output?.statusCode;
        const errorMessage = error.message || 'Unknown error';
        
        console.log(`❌ Connection closed: ${errorMessage} (Code: ${errorCode})`);
        
        // Special handling for stream errors (code 515)
        if (errorCode === 515 || errorMessage.includes('Stream Errored')) {
          console.log('🔧 Detected WebSocket stream error - using enhanced reconnection');
        }
      }

      if (shouldReconnect) {
        await connectionManager.handleReconnection(error, context);
      } else {
        console.log('🛑 Bot logged out - manual intervention required');
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
  await commandSystem.loadCommands();
  
  console.log(`✅ Unified Command System loaded: ${commandSystem.getStats().totalCommands} commands`);
  console.log(`📂 Categories: ${commandSystem.getAllCategories().join(', ')}`);
  
  // Maintain compatibility
  bot.cmd = commandSystem.commands;

  // CONSOLIDATED: Initialize Unified AI Processor (replaces multiple AI systems)
  const { UnifiedAIProcessor } = await import('./src/services/UnifiedAIProcessor.js');
  const unifiedAI = new UnifiedAIProcessor(bot, context);
  
  bot.ev.on('messages.upsert', async m => {
    const msg = m.messages[0];
    if (!msg.message) return;
    if (msg.key.fromMe) return; // Ignore own messages

    // Enhanced serialization for intelligent processing
    const intelligentMsg = {
      key: {
        remoteJid: msg.key.remoteJid,
        fromMe: msg.key.fromMe,
        id: msg.key.id,
      },
      message: msg.message,
      type: Object.keys(msg.message)[0],
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
    const isCommand = await commandSystem.processMessage(intelligentMsg);
    
    if (!isCommand) {
      // Only process with AI if it's not a command (smart filtering)
      try {
        await unifiedAI.processMessage(intelligentMsg);
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

// lib/connectionManager.js
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import pino from 'pino';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, rmSync } from 'node:fs';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';

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
        if (context.bot) {
          try {
            context.bot.ev.removeAllListeners();
            if (context.bot.ws) {
              context.bot.ws.close();
            }
            context.bot = null;
          } catch (cleanupError) {
            console.warn('⚠️  Cleanup warning:', cleanupError.message);
          }
        }

        // Create new bot instance directly instead of calling main recursively
        const newBot = await this.createBotInstance(context);
        context.bot = newBot;
        
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
        context.bot = bot;
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

export default ConnectionManager;

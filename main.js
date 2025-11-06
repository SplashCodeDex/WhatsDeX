import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import pino from 'pino';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import messageQueue from './src/worker.js';
import IntelligentMessageProcessor from './src/IntelligentMessageProcessor.js';
// Enhanced reconnection state management
let reconnectionState = {
  isReconnecting: false,
  attemptCount: 0,
  lastError: null,
  maxRetries: 10,
  baseDelay: 2000, // 2 seconds
  maxDelay: 300000, // 5 minutes
  backoffMultiplier: 1.5
};

const main = async context => {
  const { config } = context;

  // Reset reconnection state on successful main() call
  if (reconnectionState.isReconnecting) {
    console.log(`✅ Reconnection successful after ${reconnectionState.attemptCount} attempts`);
    reconnectionState.isReconnecting = false;
    reconnectionState.attemptCount = 0;
    reconnectionState.lastError = null;
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
      qrcode.generate(qr, { small: true });
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
        await handleReconnection(error, context);
      } else {
        console.log('🛑 Bot logged out - manual intervention required');
      }
    } else if (connection === 'open') {
      console.log('✅ Bot connected to WhatsApp!');
      console.log('Bot JID:', bot.user.id);
      global.bot = bot;
    } else if (connection === 'connecting') {
      console.log('🔄 Connecting to WhatsApp...');
    }
  });

  // Initialize Intelligent Message Processor
  const intelligentProcessor = new IntelligentMessageProcessor(bot, context);
  
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

    // Route to intelligent processing queue
    messageQueue.add('processIntelligentMessage', {
      messageData: intelligentMsg,
      botContext: context,
      processor: intelligentProcessor
    });
  });

  return bot;
};

/**
 * Enhanced reconnection handler with intelligent retry logic
 */
async function handleReconnection(error, context) {
  if (reconnectionState.isReconnecting) {
    console.log('⏳ Reconnection already in progress, skipping duplicate attempt');
    return;
  }

  reconnectionState.isReconnecting = true;
  reconnectionState.lastError = error;
  const errorCode = error?.output?.statusCode;
  const errorMessage = error?.message || 'Unknown error';

  // Determine reconnection strategy based on error type
  let strategy = 'exponential_backoff';
  let maxRetries = reconnectionState.maxRetries;

  if (errorCode === 515 || errorMessage.includes('Stream Errored')) {
    strategy = 'stream_error_recovery';
    maxRetries = 15; // More retries for stream errors
    console.log('🔧 Using stream error recovery strategy');
  } else if (errorMessage.includes('auth') || errorMessage.includes('login')) {
    strategy = 'auth_recovery';
    maxRetries = 5;
    console.log('🔐 Using authentication recovery strategy');
  } else if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
    strategy = 'network_recovery';
    maxRetries = 12;
    console.log('🌐 Using network recovery strategy');
  }

  console.log(`🔄 Starting ${strategy} reconnection (Max retries: ${maxRetries})`);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    reconnectionState.attemptCount = attempt;
    
    try {
      console.log(`🔄 Reconnection attempt ${attempt}/${maxRetries} (${strategy})`);
      
      // Clean up current bot instance
      if (global.bot) {
        try {
          await global.bot.logout();
        } catch (cleanupError) {
          console.warn('⚠️ Bot cleanup warning:', cleanupError.message);
        }
        global.bot = null;
      }

      // Calculate delay based on strategy
      const delay = calculateReconnectionDelay(attempt, strategy);
      console.log(`⏱️ Waiting ${delay}ms before attempt ${attempt}`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Attempt reconnection
      await main(context);
      
      // If we reach here, reconnection was successful
      console.log(`✅ Reconnection successful on attempt ${attempt}`);
      return;
      
    } catch (reconnectError) {
      console.error(`❌ Reconnection attempt ${attempt} failed:`, reconnectError.message);
      
      if (attempt === maxRetries) {
        console.error(`💥 All ${maxRetries} reconnection attempts failed. Manual intervention required.`);
        reconnectionState.isReconnecting = false;
        
        // Final fallback - try one more time after 30 seconds
        console.log('🕐 Scheduling final fallback attempt in 30 seconds...');
        setTimeout(async () => {
          try {
            await main(context);
          } catch (finalError) {
            console.error('💀 Final fallback attempt failed:', finalError.message);
          }
        }, 30000);
        return;
      }
    }
  }
}

/**
 * Calculate reconnection delay based on attempt number and strategy
 */
function calculateReconnectionDelay(attempt, strategy) {
  const { baseDelay, maxDelay, backoffMultiplier } = reconnectionState;
  
  let delay;
  
  switch (strategy) {
    case 'stream_error_recovery':
      // Faster retries for stream errors
      delay = Math.min(baseDelay * Math.pow(1.2, attempt - 1), 30000);
      break;
      
    case 'auth_recovery':
      // Longer delays for auth issues
      delay = Math.min(baseDelay * Math.pow(2, attempt - 1), 60000);
      break;
      
    case 'network_recovery':
      // Standard exponential backoff for network issues
      delay = Math.min(baseDelay * Math.pow(backoffMultiplier, attempt - 1), maxDelay);
      break;
      
    default:
      delay = Math.min(baseDelay * Math.pow(backoffMultiplier, attempt - 1), maxDelay);
  }
  
  // Add jitter to avoid thundering herd
  const jitter = delay * 0.1 * (Math.random() * 2 - 1);
  return Math.max(1000, delay + jitter); // Minimum 1 second delay
}

export default main;

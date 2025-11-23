import makeWASocket, { useMultiFileAuthState, DisconnectReason, Browsers } from '@whiskeysockets/baileys';
import handler from './events/handler.js';
import pino from 'pino';
import NodeCache from 'node-cache';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, rmSync } from 'node:fs';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import ConnectionManager from './lib/connectionManager.js';
import { jobResultsQueue } from './lib/queues.js';

let isQueueHandlerSet = false;

const main = async context => {
  const { config, logger } = context;

  // Validate critical configuration
  if (!config?.bot?.authAdapter?.default?.authDir) {
    throw new Error('Missing critical configuration: config.bot.authAdapter.default.authDir');
  }

  const connectionManager = new ConnectionManager(config.connection);

  // Add comprehensive error handling wrapper
  try {

    // Reset reconnection state on successful main() call
    if (connectionManager.state.isReconnecting) {
      connectionManager.onReconnectionSuccess();
    }

    const startBot = async () => {
      const authDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), config.bot.authAdapter.default.authDir);

      // Ensure auth directory exists
      if (!existsSync(authDir)) {
        logger.info(`📁 Creating auth directory: ${authDir}`);
        try {
          const fs = await import('node:fs/promises');
          await fs.mkdir(authDir, { recursive: true });
        } catch (dirError) {
          logger.error(`❌ Failed to create auth directory: ${dirError.message}`);
          throw new Error(`Auth directory setup failed: ${dirError.message}`);
        }
      }

      const { state, saveCreds } = await useMultiFileAuthState(authDir);
      const groupCache = new NodeCache({ stdTTL: 5 * 60, useClones: false });

      // console.log('🤖 Initializing bot with browser config:', config.bot.browser);

      const bot = makeWASocket({
        auth: state,
        logger: context.logger,
        browser: Browsers.ubuntu('Desktop'), // Use standard Ubuntu browser config
        defaultQueryTimeoutMs: 60000, // 60 seconds timeout
        retryRequestDelayMs: 250,
        maxMsgRetryCount: 5,
        keepAliveIntervalMs: 30000, // 30 seconds keep-alive
        cachedGroupMetadata: async (jid) => groupCache.get(jid),
        markOnlineOnConnect: false, // Recommended to keep notifications working on phone
      });

      context.bot = bot;

      // Initialize Event Handler
      handler(bot, context);

      // Listen for job results from the worker
      if (!isQueueHandlerSet) {
        jobResultsQueue.process(async (job) => {
          const { userJid, imageUrl, input, used, success, error } = job.data;
          const { formatter } = context;
          const currentBot = context.bot;

          if (!currentBot) {
            logger.error('❌ Bot instance not available for processing job result');
            return;
          }

          try {
            if (success) {
              logger.info(`✅ Sending completed job result to ${userJid}`);
              await currentBot.sendMessage(userJid, {
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
              logger.error(`❌ Job failed for ${userJid}. Reason: ${error}`);
              await bot.sendMessage(userJid, {
                text: `Maaf, terjadi kesalahan saat membuat gambar: ${error}`,
              });
            }
          } catch (e) {
            logger.error(`❌ Failed to send job result message to ${userJid}:`, e);
          }
        });
        isQueueHandlerSet = true;
      }


      bot.ev.on('creds.update', saveCreds);

      // Add WebSocket error handling
      bot.ev.on('CB:stream-error', (streamError) => {
        logger.error('🌊 WebSocket stream error detected:', streamError);
        if (streamError?.attrs?.code === '515') {
          logger.info('🔧 Stream error code 515 - Connection will be restarted');
        }
      });

      // Monitor connection quality
      bot.ev.on('CB:call', (call) => {
        if (call?.attrs?.type === 'error') {
          logger.warn('📞 Call error detected:', call);
        }
      });

      // Add message send error handling
      bot.ev.on('CB:receipt', (receipt) => {
        if (receipt?.attrs?.type === 'error') {
          logger.warn('📧 Message receipt error:', receipt);
        }
      });

      bot.ev.on('connection.update', async update => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          logger.info('📱 Generating QR Code...');
          try {
            // Generate QR for terminal
            qrcode.generate(qr, { small: true });
            logger.info('✅ QR Code generated in terminal.');

            // Emit QR to web dashboard
            if (context.io) {
              context.io.emit('qr-code-update', {
                qr: qr,
                timestamp: Date.now(),
                status: 'qr_ready'
              });
              logger.info('✅ QR Code emitted to web interface.');
            }

            // Store QR for web API access
            context.state.currentQR = {
              code: qr,
              timestamp: Date.now(),
              status: 'ready'
            };

          } catch (e) {
            logger.error('❌ Failed to generate or broadcast QR code:', e.message);
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

          logger.info(`❌ Connection closed: ${errorMessage} (Code: ${errorCode})`);

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
            [DisconnectReason.restartRequired]: 'Restart Required (515)',
            405: 'Method not allowed - likely session/auth issue (405)'
          };

          if (errorDescriptions[errorCode]) {
            logger.info(`🔍 Error details: ${errorDescriptions[errorCode]}`);
          }

          // Special handling for specific error codes
          if (errorCode === 405) {
            logger.warn('⚠️  HTTP 405 detected - this suggests session/authentication issues');
            logger.info('🔧 Clearing session and forcing fresh authentication...');
            shouldReconnect = true;

            // Clear session data for 405 errors
            try {
              const authDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), context.config.bot.authAdapter.default.authDir);
              if (existsSync(authDir)) {
                // Try to rename first to avoid locking issues, then delete
                const backupDir = `${authDir}_backup_${Date.now()}`;
                const fs = await import('node:fs');
                try {
                  fs.renameSync(authDir, backupDir);
                  fs.rmSync(backupDir, { recursive: true, force: true });
                } catch (e) {
                  // If rename fails, try direct delete
                  rmSync(authDir, { recursive: true, force: true });
                }

                logger.info('✅ Session cleared - will generate new QR code');
                // Add delay to ensure filesystem operations complete
                await new Promise(resolve => setTimeout(resolve, 5000));
              }
            } catch (clearError) {
              logger.warn('⚠️  Could not clear session:', clearError.message);
            }
          }

          if (shouldReconnect) {
            // Ensure reconnection attempt counter is properly tracked
            logger.info(`🔄 Initiating reconnection (Attempt will be: ${connectionManager.state.attemptCount + 1}/${connectionManager.state.maxRetries})`);
            await connectionManager.handleReconnection(error, context);
          } else {
            logger.info(`🛑 Bot logged out or forbidden - manual intervention required (Code: ${errorCode})`);
          }
        } else if (connection === 'open') {
          logger.info('✅ Bot connected to WhatsApp!');
          logger.info('Bot JID:', bot.user.id);
          context.bot = bot;

          // CONSOLIDATED: Single connection success handler with all features
          if (context.io) {
            context.io.emit('connection-status', {
              status: 'connected',
              timestamp: Date.now(),
              message: 'WhatsApp connected successfully'
            });
          }

          // Clear QR code data - sophisticated state management
          context.currentQR = {
            code: null,
            timestamp: Date.now(),
            status: 'connected'
          };
        } else if (connection === 'connecting') {
          logger.info('🔄 Connecting to WhatsApp...');
        }
        // REMOVED: Duplicate 'connection === open' handler eliminated
      });

      context.commandSystem.bot = bot;
      context.unifiedAI.bot = bot;

      try {
        await context.commandSystem.loadCommands();
        logger.info(`✅ Unified Command System loaded: ${context.commandSystem.getStats().totalCommands} commands`);
        logger.info(`📂 Categories: ${context.commandSystem.getAllCategories().join(', ')}`);
      } catch (commandLoadError) {
        logger.error(`❌ Failed to load commands: ${commandLoadError.message}`);
        logger.warn('⚠️ Continuing without command system...');
      }

      // Maintain compatibility
      bot.cmd = context.commandSystem.commands;

      // Listener removed to prevent conflict with handler.js
      // Command execution is now centralized in backend/events/handler.js

      return bot;
    };

    // Register the startBot function with connectionManager
    connectionManager.setReconnector(startBot);

    // Initial start
    await startBot();

  } catch (error) {
    logger.error('💀 Critical error in main function:', error.message);
    logger.error('Stack trace:', error.stack);

    // Determine if error is recoverable
    const isRecoverable = !error.message.includes('EADDRINUSE') &&
      !error.message.includes('FATAL') &&
      !error.message.includes('Cannot find module');

    if (isRecoverable && !connectionManager.state.isReconnecting) {
      logger.info('🔄 Attempting recovery from critical error...');
      throw error; // Let connection manager handle it
    } else {
      logger.error('💀 Non-recoverable error or already reconnecting');
      process.exit(1);
    }
  }
};


export default main;

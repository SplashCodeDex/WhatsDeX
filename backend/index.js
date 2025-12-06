// Impor modul dan dependensi yang diperlukan
import CFonts from 'cfonts';
import initializeContext from './context.js'; // Changed import
import main from './main.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { startServer } from './src/server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf-8'));

import { withRetry } from './lib/retry.js';
import multiTenantStripeService from './src/services/multiTenantStripeService.js';

// Ensure root .env is loaded for all backend imports
import 'dotenv/config';

// --- Main Application IIFE ---
(async () => {
  // --- Initialize Context ---
  // Wait for dependencies to be ready before initializing context
  try {
    const { waitForDependencies } = await import('./src/utils/readiness.js');
    await waitForDependencies({ logger });
  } catch (e) {
    console.error('❌ Dependency readiness check failed:', e?.message || e);
    process.exit(1);
  }

  const context = await initializeContext();
  const { config, logger } = context;
  logger.info('🚀 Starting WhatsDeX...');
  logger.info('⏳ Initializing application context and connecting to database...');
  logger.info('✅ Context initialized successfully.');

  // --- Display Banner ---
  CFonts.say(pkg.name, {
    colors: ['#00A1E0', '#00FFFF'],
    align: 'center',
  });
  CFonts.say(`${pkg.description} - By ${pkg.author}`, {
    font: 'console',
    colors: ['#E0F7FF'],
    align: 'center',
  });

  // --- Initialize Stripe (if configured) ---
  try {
    const sk = process.env.STRIPE_SECRET_KEY;
    const wh = process.env.STRIPE_WEBHOOK_SECRET;
    if (sk && wh) {
      await multiTenantStripeService.initialize(sk, wh);
      logger.info('✅ Stripe initialized with webhook verification');
    } else {
      logger.warn('⚠️ Stripe not initialized: STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET missing');
    }
  } catch (e) {
    logger.error('❌ Stripe initialization failed', { error: e?.message || String(e) });
  }

  // --- Start Web Server ---
  let server;
  try {
    if (config?.system?.useServer) {
      const serverResult = await startServer(config);
      if (serverResult?.io) {
        context.io = serverResult.io;
        server = serverResult.server;
        logger.info('✅ Socket.IO assigned to context');
      }
    } else {
      logger.info('🔕 Server disabled in configuration');
    }
  } catch (error) {
    logger.error('❌// Force restart Server startup failed:', error);
    logger.warn('⚠️ Continuing without web server...');
  }

  // --- Graceful Shutdown Handler ---
  let isShuttingDown = false;
  const gracefulShutdown = async (signal, error = null) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info(`🔄 Starting graceful shutdown (${signal})...`);
    if (error) {
      logger.error('🚨 Error triggered shutdown:', error);
    }

    // Use the shutdown method from the initialized context
    if (context && typeof context.shutdown === 'function') {
      await context.shutdown();
    }

    // Close server if running
    if (server) {
      logger.info('🔄 Closing server...');
      await new Promise(resolve => server.close(() => resolve()));
    }

    logger.info('✅ Graceful shutdown completed');
    process.exit(error ? 1 : 0);
  };

  // --- Process-wide Error Handlers ---
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('🚨 Unhandled Rejection at:', { promise, reason });
    gracefulShutdown('unhandledRejection', reason);
  });
  process.on('uncaughtException', (error) => {
    logger.error('🚨 Uncaught Exception:', error);
    gracefulShutdown('uncaughtException', error);
  });
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));


  // --- Main Application Logic with Retry ---
  try {
    await withRetry(() => main(context));
  } catch (error) {
    console.error('💀 Main application failed after multiple retries. Shutting down...');
    if (context?.logger) {
      context.logger.error('Main Application Failed', {
        error: error.message,
        stack: error.stack,
      });
    }
    await gracefulShutdown('mainError', error);
  }
})();

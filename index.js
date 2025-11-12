// Impor modul dan dependensi yang diperlukan
import CFonts from 'cfonts';
import initializeContext from './context.js'; // Changed import
import main from './main.js';
import pkg from './package.json' with { type: 'json' };
import { startServer } from './src/server.js';

// --- Main Application IIFE ---
(async () => {
  console.log('🚀 Starting WhatsDeX...');

  // --- Initialize Context ---
  console.log('⏳ Initializing application context and connecting to database...');
  const context = await initializeContext();
  const { config } = context;
  console.log('✅ Context initialized successfully.');

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

  // --- Start Web Server ---
  try {
    if (config?.system?.useServer) {
      const serverResult = await startServer(config);
      if (serverResult?.io) {
        global.io = serverResult.io;
        global.server = serverResult.server;
        console.log('✅ Socket.IO assigned to global scope');
      }
    } else {
      console.log('🔕 Server disabled in configuration');
    }
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    console.warn('⚠️ Continuing without web server...');
  }

  // --- Graceful Shutdown Handler ---
  let isShuttingDown = false;
  const gracefulShutdown = async (signal, error = null) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`🔄 Starting graceful shutdown (${signal})...`);
    if (error) {
      console.error('🚨 Error triggered shutdown:', error);
    }

    // Use the shutdown method from the initialized context
    if (context && typeof context.shutdown === 'function') {
      await context.shutdown();
    }

    // Close server if running
    if (global.server) {
      console.log('🔄 Closing server...');
      await new Promise(resolve => global.server.close(() => resolve()));
    }

    console.log('✅ Graceful shutdown completed');
    process.exit(error ? 1 : 0);
  };

  // --- Process-wide Error Handlers ---
  process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection', reason);
  });
  process.on('uncaughtException', (error) => {
    console.error('🚨 Uncaught Exception:', error);
    gracefulShutdown('uncaughtException', error);
  });
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));


  // --- Main Application Logic with Retry ---
  let retryCount = 0;
  const maxRetries = 3;
  
  while (retryCount < maxRetries) {
    try {
      console.log(retryCount > 0 ? `🔄 Retry attempt ${retryCount}/${maxRetries - 1}` : '🚀 Starting main application...');
      await main(context); // Pass the fully initialized context
      break; // Success, exit retry loop
    } catch (error) {
      retryCount++;
      console.error(`❌ Main application error (attempt ${retryCount}): ${error.message}`);
      
      if (context?.logger) {
        context.logger.error('Main Application Error', {
          error: error.message,
          stack: error.stack,
          attempt: retryCount
        });
      }
      
      if (retryCount >= maxRetries) {
        console.error('💀 Max retry attempts reached. Shutting down...');
        await gracefulShutdown('mainError', error);
      } else {
        const delay = retryCount * 5000;
        console.log(`⏰ Waiting ${delay/1000}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
})();
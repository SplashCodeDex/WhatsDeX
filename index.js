// Impor modul dan dependensi yang diperlukan
import CFonts from 'cfonts';
import http from 'node:http';
import context from './context.js';
import main from './main.js';
import pkg from './package.json' with { type: 'json' };

const { config } = {
  config: context.config,
};

console.log('🚀 Starting WhatsDeX...'); // Logging initial process

// Tampilkan nama proyek serta deskripsi lain
CFonts.say(pkg.name, {
  colors: ['#00A1E0', '#00FFFF'],
  align: 'center',
});

CFonts.say(`${pkg.description} - By ${pkg.author}`, {
  font: 'console',
  colors: ['#E0F7FF'],
  align: 'center',
});

import { startServer } from './src/server.js';

// Wait for context to be fully initialized before starting server
console.log('⏳ Waiting for context initialization...');
await new Promise(resolve => setTimeout(resolve, 1000)); // Give context time to initialize

// Start server if enabled in configuration
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

// Enhanced global error handling with graceful shutdown
let isShuttingDown = false;

const gracefulShutdown = async (signal, error = null) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`🔄 Starting graceful shutdown (${signal})...`);
  
  if (error) {
    console.error('🚨 Error triggered shutdown:', error);
    if (context?.logger) {
      context.logger.error(`Shutdown triggered by ${signal}`, {
        error: error.message,
        stack: error.stack
      });
    }
  }

  try {
    // Close WhatsApp connection
    if (global.bot) {
      console.log('🔄 Closing WhatsApp connection...');
      try {
        global.bot.ev.removeAllListeners();
        if (global.bot.ws) {
          global.bot.ws.close();
        }
      } catch (err) {
        console.warn('⚠️  Warning during bot cleanup:', err.message);
      }
    }

    // Close database connection
    if (context?.prisma?.$disconnect) {
      console.log('🔄 Closing database connection...');
      try {
        await context.prisma.$disconnect();
      } catch (dbError) {
        console.warn('⚠️  Warning during database cleanup:', dbError.message);
      }
    }

    // Close server if running
    if (global.server) {
      console.log('🔄 Closing server...');
      try {
        await new Promise((resolve) => {
          global.server.close(() => resolve());
        });
      } catch (serverError) {
        console.warn('⚠️  Warning during server cleanup:', serverError.message);
      }
    }

    // Give time for cleanup
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✅ Graceful shutdown completed');
    process.exit(error ? 1 : 0);
  } catch (shutdownError) {
    console.error('❌ Error during shutdown:', shutdownError);
    process.exit(1);
  }
};

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection', reason);
});

process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  gracefulShutdown('uncaughtException', error);
});

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

(async () => {
  let retryCount = 0;
  const maxRetries = 3;
  
  while (retryCount < maxRetries) {
    try {
      console.log(retryCount > 0 ? `🔄 Retry attempt ${retryCount}/${maxRetries - 1}` : '🚀 Starting main application...');
      await main(context); // Jalankan modul utama dengan async/await
      break; // Success, exit retry loop
    } catch (error) {
      retryCount++;
      console.error(`❌ Main application error (attempt ${retryCount}): ${error.message}`);
      
      // Log the error properly if logger is available
      if (context?.logger) {
        context.logger.error('Main Application Error', {
          error: error.message,
          stack: error.stack,
          attempt: retryCount
        });
      }
      
      // If this was the last attempt, trigger shutdown
      if (retryCount >= maxRetries) {
        console.error('💀 Max retry attempts reached. Shutting down...');
        await gracefulShutdown('mainError', error);
      } else {
        // Wait before retrying
        const delay = retryCount * 5000; // Progressive delay
        console.log(`⏰ Waiting ${delay/1000}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
})();

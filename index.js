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

import { initSocket } from './server.js';

// Jalankan server jika diaktifkan dalam konfigurasi
if (config.system.useServer) {
  const { port } = config.system;
  const server = http.createServer((_, res) => res.end(`${pkg.name} is running on port ${port}`));
  initSocket(server);
  server.listen(port, () => console.log(`✅ ${pkg.name} runs on port ${port}`));
}

// Global error handling for unhandled promise rejections and uncaught exceptions
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  // Log the error properly if logger is available
  if (context?.logger) {
    context.logger.error('Unhandled Promise Rejection', {
      reason: reason?.message || reason,
      stack: reason?.stack,
      promise: promise
    });
  }
  // Graceful shutdown
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  // Log the error properly if logger is available
  if (context?.logger) {
    context.logger.error('Uncaught Exception', {
      error: error.message,
      stack: error.stack
    });
  }
  // Graceful shutdown
  process.exit(1);
});

(async () => {
  try {
    await main(context); // Jalankan modul utama dengan async/await
  } catch (error) {
    console.error(`❌ Fatal Error: ${error.message}`);
    // Log the error properly if logger is available
    if (context?.logger) {
      context.logger.error('Main Application Error', {
        error: error.message,
        stack: error.stack
      });
    }
    process.exit(1);
  }
})();

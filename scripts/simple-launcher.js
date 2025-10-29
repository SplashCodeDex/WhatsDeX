#!/usr/bin/env node

/**
 * Simple WhatsApp Bot Launcher
 * Clean and minimal launcher focused only on starting the bot
 */

const { spawn } = require('child_process');
import path from 'path';

class SimpleLauncher {
  constructor() {
    this.botProcess = null;
    this.parseArguments();
  }

  /**
   * Parse command line arguments
   */
  parseArguments() {
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
      this.showHelp();
      process.exit(0);
    }

    if (args.includes('--verbose') || args.includes('-v')) {
      this.verbose = true;
    }
  }

  /**
   * Show help information
   */
  showHelp() {
    console.log(`
🚀 Simple WhatsApp Bot Launcher
Clean and minimal launcher for WhatsDeX

USAGE:
  node scripts/simple-launcher.js [options]

OPTIONS:
  --verbose, -v     Enable verbose logging
  --help, -h        Show this help message

EXAMPLES:
  node scripts/simple-launcher.js          # Start the bot
  node scripts/simple-launcher.js --verbose # Start with verbose logging

The launcher will:
  ✅ Start the WhatsApp bot
  ✅ Display QR code for authentication
  ✅ Handle reconnection automatically
  ✅ Provide clean shutdown on Ctrl+C
    `);
  }

  /**
   * Start the bot
   */
  async start() {
    console.log('🚀 Starting WhatsDeX Bot...\n');

    try {
      // Start the main bot process
      const botProcess = spawn('node', ['index.js'], {
        cwd: path.join(__dirname, '..'),
        stdio: this.verbose ? 'inherit' : 'pipe'
      });

      this.botProcess = botProcess;

      // Handle process events
      botProcess.on('exit', (code, signal) => {
        if (code !== null) {
          console.log(`\n🤖 Bot exited with code ${code}`);
        } else {
          console.log(`\n🤖 Bot stopped by signal ${signal}`);
        }
        process.exit(code || 0);
      });

      botProcess.on('error', (error) => {
        console.error('❌ Failed to start bot:', error.message);
        process.exit(1);
      });

      // Handle graceful shutdown
      process.on('SIGINT', () => {
        console.log('\n🛑 Received SIGINT, shutting down gracefully...');
        if (botProcess && !botProcess.killed) {
          botProcess.kill('SIGTERM');
        }
        process.exit(0);
      });

      process.on('SIGTERM', () => {
        console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
        if (botProcess && !botProcess.killed) {
          botProcess.kill('SIGTERM');
        }
        process.exit(0);
      });

      console.log('✅ Bot started successfully!');
      console.log('📱 Scan the QR code above to authenticate');
      console.log('💡 Press Ctrl+C to stop the bot\n');

    } catch (error) {
      console.error('❌ Failed to start bot:', error.message);
      process.exit(1);
    }
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the launcher
if (require.main === module) {
  const launcher = new SimpleLauncher();
  launcher.start();
}

module.exports = SimpleLauncher;

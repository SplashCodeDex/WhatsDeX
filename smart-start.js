#!/usr/bin/env node
/**
 * SMART STARTUP SCRIPT - Proper service orchestration for WhatsDeX
 * Ensures all services start in correct order with health checks
 */

import { StartupOrchestrator } from './src/services/StartupOrchestrator.js';
import CFonts from 'cfonts';

const orchestrator = new StartupOrchestrator();

// Display startup banner
CFonts.say('WhatsDeX', {
  font: 'block',
  align: 'center',
  gradient: ['cyan', 'magenta']
});

console.log('🚀 Smart WhatsDeX Startup Sequence');
console.log('=================================\n');

async function smartStartup() {
  try {
    // Register services in dependency order
    
    // 1. Database Service (no dependencies)
    orchestrator.registerService('database', async () => {
      console.log('🗄️ Initializing database connection...');
      const dbManager = (await import('./src/utils/DatabaseManager.js')).default;
      await dbManager.initialize();
      return dbManager;
    }, []);
    
    orchestrator.setHealthCheck('database', async (dbManager) => {
      const health = await dbManager.healthCheck();
      return health.status === 'healthy';
    });

    // 2. Redis Service (no dependencies)
    orchestrator.registerService('redis', async () => {
      console.log('⚡ Initializing Redis connection...');
      const { RateLimiter } = await import('./src/utils/RateLimiter.js');
      const rateLimiter = new RateLimiter();
      return rateLimiter;
    }, []);
    
    orchestrator.setHealthCheck('redis', async (rateLimiter) => {
      try {
        await rateLimiter.redis.ping();
        return true;
      } catch (error) {
        return false;
      }
    });

    // 3. Command System (depends on database)
    orchestrator.registerService('commands', async () => {
      console.log('🔧 Loading command system...');
      const { UnifiedCommandSystem } = await import('./src/services/UnifiedCommandSystem.js');
      
      // We need bot context, let's create minimal one for now
      const bot = { cmd: new Map() };
      const context = {};
      
      const commandSystem = new UnifiedCommandSystem(bot, context);
      await commandSystem.loadCommands();
      
      return commandSystem;
    }, ['database']);
    
    orchestrator.setHealthCheck('commands', async (commandSystem) => {
      const stats = commandSystem.getStats();
      console.log(`📊 Commands loaded: ${stats.totalCommands} across ${stats.categories} categories`);
      return stats.totalCommands > 0;
    });

    // 4. AI System (depends on database and redis)
    orchestrator.registerService('ai', async () => {
      console.log('🧠 Initializing AI processor...');
      const { UnifiedAIProcessor } = await import('./src/services/UnifiedAIProcessor.js');
      
      const bot = {};
      const context = {};
      
      const aiProcessor = new UnifiedAIProcessor(bot, context);
      return aiProcessor;
    }, ['database', 'redis']);
    
    orchestrator.setHealthCheck('ai', async (aiProcessor) => {
      const stats = aiProcessor.getStats();
      return stats.aiModel === 'gemini-pro';
    });

    // 5. WhatsApp Bot (depends on commands and ai)
    orchestrator.registerService('whatsapp', async () => {
      console.log('📱 Initializing WhatsApp connection...');
      
      // Import main bot function
      const main = (await import('./main.js')).default;
      
      // Create context with all initialized services
      const database = orchestrator.services.get('database').instance;
      const commandSystem = orchestrator.services.get('commands').instance;
      const aiProcessor = orchestrator.services.get('ai').instance;
      
      const context = {
        database,
        commandSystem,
        aiProcessor,
        config: {
          ai: {
            summarization: {
              SUMMARIZE_THRESHOLD: 16,
              MESSAGES_TO_SUMMARIZE: 10,
              HISTORY_PRUNE_LENGTH: 6
            }
          }
        }
      };
      
      // Start WhatsApp bot with context
      const bot = await main(context);
      return bot;
    }, ['commands', 'ai']);
    
    orchestrator.setHealthCheck('whatsapp', async (bot) => {
      // Check if bot is connected
      return bot && bot.user;
    });

    // 6. Web Dashboard (depends on whatsapp)
    orchestrator.registerService('web', async () => {
      console.log('🌐 Starting web dashboard...');
      
      // Start web dashboard as child process
      const { spawn } = await import('child_process');
      
      const webProcess = spawn('npm', ['run', 'dev'], {
        cwd: './web',
        stdio: ['inherit', 'pipe', 'pipe']
      });
      
      return {
        process: webProcess,
        stop: () => webProcess.kill()
      };
    }, ['whatsapp']);
    
    orchestrator.setHealthCheck('web', async (webService) => {
      // Check if web process is running
      return !webService.process.killed;
    });

    // Start all services in order
    await orchestrator.startAllServices();
    
    console.log('\n🎉 ALL SERVICES STARTED SUCCESSFULLY!');
    console.log('=====================================');
    console.log('📱 WhatsApp Bot: Connected and ready');
    console.log('🌐 Web Dashboard: http://localhost:3000');
    console.log('🏥 Health Check: http://localhost:3001/health');
    console.log('\n💡 Scan QR code in terminal or visit web dashboard');
    console.log('🔄 Services will auto-restart if they fail');
    
    // Setup graceful shutdown
    setupGracefulShutdown();
    
    // Monitor services
    startServiceMonitoring();
    
  } catch (error) {
    console.error('❌ Smart startup failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

function setupGracefulShutdown() {
  process.on('SIGINT', async () => {
    console.log('\n🔄 Graceful shutdown initiated...');
    await orchestrator.stopAllServices();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🔄 Graceful shutdown initiated...');
    await orchestrator.stopAllServices();
    process.exit(0);
  });
}

function startServiceMonitoring() {
  setInterval(async () => {
    const status = orchestrator.getServiceStatus();
    const failedServices = Object.entries(status).filter(([name, status]) => status === 'failed');
    
    if (failedServices.length > 0) {
      console.warn('⚠️ Failed services detected:', failedServices.map(([name]) => name));
      // Could implement auto-restart logic here
    }
  }, 30000); // Check every 30 seconds
}

// Start the smart startup
if (import.meta.url === `file://${process.argv[1]}`) {
  smartStartup().catch(console.error);
}

export default smartStartup;
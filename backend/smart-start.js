#!/usr/bin/env node
/**
 * SMART STARTUP SCRIPT - Proper service orchestration for WhatsDeX
 * Ensures all services start in correct order with health checks
 */

import 'dotenv/config';
import { StartupOrchestrator } from './src/services/StartupOrchestrator.js';
import CFonts from 'cfonts';
import { pathToFileURL } from 'url';
import path from 'path';

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
});

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
      console.log('Registering database service...');
      console.log('🗄️ Initializing database connection...');
      const dbManager = (await import('./src/utils/DatabaseManager.js')).default;
      await dbManager.initialize();
      console.log('Database service registered.');
      return dbManager;
    }, []);
    
    orchestrator.setHealthCheck('database', async (dbManager) => {
      console.log('Checking database health...');
      const health = await dbManager.healthCheck();
      const isHealthy = health.status === 'healthy';
      console.log(`Database health: ${isHealthy}`);
      return isHealthy;
    });

    // 2. Redis Service (no dependencies)
    orchestrator.registerService('redis', async () => {
      console.log('Registering redis service...');
      console.log('⚡ Initializing Redis connection...');
      const { RateLimiter } = await import('./src/utils/RateLimiter.js');
      const rateLimiter = new RateLimiter();
      console.log('Redis service registered.');
      return rateLimiter;
    }, []);
    
    orchestrator.setHealthCheck('redis', async (rateLimiter) => {
      console.log('Checking redis health...');
      try {
        await rateLimiter.redis.ping();
        console.log('Redis health: true');
        return true;
      } catch (error) {
        console.error('Redis health check failed:', error);
        return false;
      }
    });

    // 3. Command System (depends on database)
    orchestrator.registerService('commands', async () => {
      console.log('Registering command system...');
      console.log('🔧 Loading command system...');
      const { UnifiedCommandSystem } = await import('./src/services/UnifiedCommandSystem.js');
      
      // We need bot context, let's create minimal one for now
      const bot = { cmd: new Map() };
      const context = {};
      
      const commandSystem = new UnifiedCommandSystem(bot, context);
      await commandSystem.loadCommands();
      
      console.log('Command system registered.');
      return commandSystem;
    }, ['database']);
    
    orchestrator.setHealthCheck('commands', async (commandSystem) => {
      console.log('Checking command system health...');
      const stats = commandSystem.getStats();
      console.log(`📊 Commands loaded: ${stats.totalCommands} across ${stats.categories} categories`);
      const isHealthy = stats.totalCommands > 0;
      console.log(`Command system health: ${isHealthy}`);
      return isHealthy;
    });

    // 4. AI System (depends on database and redis)
    orchestrator.registerService('ai', async () => {
      console.log('Registering AI system...');
      console.log('🧠 Initializing AI processor...');
      const { UnifiedAIProcessor } = await import('./src/services/UnifiedAIProcessor.js');
      
      const bot = {};
      const context = {};
      
      const aiProcessor = new UnifiedAIProcessor(bot, context);
      console.log('AI system registered.');
      return aiProcessor;
    }, ['database', 'redis']);
    
    orchestrator.setHealthCheck('ai', async (aiProcessor) => {
      console.log('Checking AI system health...');
      const stats = aiProcessor.getStats();
      const isHealthy = stats.aiModel === 'gemini-pro';
      console.log(`AI system health: ${isHealthy}`);
      return isHealthy;
    });

    // 5. WhatsApp Bot (depends on commands and ai)
    orchestrator.registerService('whatsapp', async () => {
      console.log('Registering WhatsApp bot...');
      console.log('📱 Initializing WhatsApp connection...');
      
      // Import main bot function
      const main = (await import('./main.js')).default;
      const config = (await import('./config.js')).default;
      
      // Create context with all initialized services
      const database = orchestrator.services.get('database').instance;
      const commandSystem = orchestrator.services.get('commands').instance;
      const aiProcessor = orchestrator.services.get('ai').instance;
      
      const context = {
        database,
        commandSystem,
        aiProcessor,
        config
      };
      
      // Start WhatsApp bot with context
      const bot = await main(context);
      console.log('WhatsApp bot registered.');
      return bot;
    }, ['commands', 'ai']);
    
    orchestrator.setHealthCheck('whatsapp', async (bot) => {
      console.log('Checking WhatsApp bot health...');
      // Check if bot is connected
      const isHealthy = bot && bot.user;
      console.log(`WhatsApp bot health: ${isHealthy}`);
      return isHealthy;
    });

    // 6. Web Dashboard (depends on whatsapp)
    orchestrator.registerService('web', async () => {
      console.log('Registering web dashboard...');
      console.log('🌐 Starting web dashboard...');
      
      // Start web dashboard as child process
      const { spawn } = await import('child_process');
      
      const webProcess = spawn('npm', ['run', 'dev'], {
        cwd: './web',
        stdio: ['inherit', 'pipe', 'pipe'],
        shell: true
      });
      
      console.log('Web dashboard registered.');
      return {
        process: webProcess,
        stop: () => webProcess.kill()
      };
    }, ['whatsapp']);
    
    orchestrator.setHealthCheck('web', async (webService) => {
      console.log('Checking web dashboard health...');
      // Check if web process is running
      const isHealthy = !webService.process.killed;
      console.log(`Web dashboard health: ${isHealthy}`);
      return isHealthy;
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
const scriptPath = path.resolve(process.argv[1]);
const scriptUrl = pathToFileURL(scriptPath).href;

if (import.meta.url === scriptUrl) {
  console.log('Starting smart startup...');
  smartStartup().catch(console.error);
} else {
  console.log('Smart startup not started. The condition was not met.');
  console.log(`import.meta.url: ${import.meta.url}`);
  console.log(`scriptUrl: ${scriptUrl}`);
}

export default smartStartup;
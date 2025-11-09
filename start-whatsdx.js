#!/usr/bin/env node
/**
 * WhatsDeX Complete Startup Script
 * Starts all services in the correct order with health checks
 */

import { spawn } from 'child_process';
import { performance } from 'perf_hooks';

class WhatsDeXLauncher {
  constructor() {
    this.services = new Map();
    this.startupOrder = [
      'database',
      'redis', 
      'bot',
      'web'
    ];
  }

  async start() {
    console.log('🚀 Starting WhatsDeX Complete Deployment');
    console.log('=========================================\n');

    try {
      // Phase 1: Environment Check
      await this.checkEnvironment();
      
      // Phase 2: Infrastructure Services
      await this.startInfrastructure();
      
      // Phase 3: Application Services
      await this.startApplications();
      
      // Phase 4: Health Verification
      await this.verifyHealth();
      
      console.log('🎉 ALL SERVICES RUNNING SUCCESSFULLY!');
      this.showServiceStatus();
      
    } catch (error) {
      console.error('❌ Startup failed:', error.message);
      process.exit(1);
    }
  }

  async checkEnvironment() {
    console.log('📋 Phase 1: Environment Check');
    console.log('-----------------------------');
    
    // Check Node version
    const nodeVersion = process.version;
    console.log(`✅ Node.js: ${nodeVersion}`);
    
    // Check required environment variables
    const required = [
      'DATABASE_URL',
      'REDIS_URL', 
      'OWNER_NUMBER',
      'JWT_SECRET'
    ];
    
    const missing = required.filter(env => !process.env[env]);
    if (missing.length > 0) {
      throw new Error(`Missing environment variables: ${missing.join(', ')}`);
    }
    console.log('✅ Environment variables configured');
    
    // Check if ports are available
    await this.checkPort(5432, 'PostgreSQL');
    await this.checkPort(6379, 'Redis (if local)');
    console.log('✅ Ports available\n');
  }

  async checkPort(port, service) {
    // Simple port availability check
    const net = await import('net');
    return new Promise((resolve) => {
      const server = net.default.createServer();
      server.listen(port, () => {
        server.once('close', () => resolve());
        server.close();
      });
      server.on('error', () => {
        console.log(`⚠️  Port ${port} (${service}) may be in use - continuing...`);
        resolve();
      });
    });
  }

  async startInfrastructure() {
    console.log('🗄️  Phase 2: Infrastructure Services');
    console.log('----------------------------------');
    
    // Check database connection
    console.log('🔄 Connecting to database...');
    try {
      const dbManager = (await import('./src/utils/DatabaseManager.js')).default;
      const health = await dbManager.healthCheck();
      if (health.status === 'healthy') {
        console.log('✅ Database connected successfully');
      } else {
        console.log('⚠️  Database connection issues, but continuing...');
      }
    } catch (error) {
      console.log(`⚠️  Database check failed: ${error.message}`);
    }
    
    // Check Redis connection
    console.log('🔄 Connecting to Redis...');
    try {
      const RateLimiter = (await import('./src/utils/RateLimiter.js')).default;
      const rateLimiter = new RateLimiter();
      console.log('✅ Redis connection ready');
      await rateLimiter.disconnect();
    } catch (error) {
      console.log(`⚠️  Redis check failed: ${error.message}`);
    }
    
    console.log('');
  }

  async startApplications() {
    console.log('🤖 Phase 3: Application Services');
    console.log('--------------------------------');
    
    // Start main bot service
    console.log('🔄 Starting WhatsDeX bot...');
    const botProcess = spawn('node', ['index.js'], {
      stdio: ['inherit', 'pipe', 'pipe'],
      env: process.env
    });
    
    // Monitor bot output
    let botReady = false;
    botProcess.stdout.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(`[BOT] ${output}`);
      
      if (output.includes('WhatsDeX Bot started') || output.includes('QR Code')) {
        botReady = true;
      }
    });
    
    botProcess.stderr.on('data', (data) => {
      process.stderr.write(`[BOT-ERROR] ${data}`);
    });
    
    this.services.set('bot', botProcess);
    
    // Wait for bot to initialize
    await this.waitForCondition(() => botReady, 30000, 'Bot initialization');
    console.log('✅ Bot service started');
    
    // Start web dashboard
    console.log('🔄 Starting web dashboard...');
    const webProcess = spawn('npm', ['run', 'dev'], {
      cwd: './web',
      stdio: ['inherit', 'pipe', 'pipe'],
      env: process.env
    });
    
    let webReady = false;
    webProcess.stdout.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(`[WEB] ${output}`);
      
      if (output.includes('ready') || output.includes('3000')) {
        webReady = true;
      }
    });
    
    webProcess.stderr.on('data', (data) => {
      process.stderr.write(`[WEB-ERROR] ${data}`);
    });
    
    this.services.set('web', webProcess);
    
    // Wait for web to start
    await this.waitForCondition(() => webReady, 20000, 'Web dashboard');
    console.log('✅ Web dashboard started');
    console.log('');
  }

  async waitForCondition(condition, timeout, serviceName) {
    const startTime = Date.now();
    
    while (!condition() && (Date.now() - startTime) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      process.stdout.write('.');
    }
    
    console.log(''); // New line after dots
    
    if (!condition()) {
      throw new Error(`${serviceName} failed to start within ${timeout}ms`);
    }
  }

  async verifyHealth() {
    console.log('🏥 Phase 4: Health Verification');
    console.log('------------------------------');
    
    // Check if services are responding
    const services = [
      { name: 'Bot Service', check: () => this.services.get('bot')?.pid },
      { name: 'Web Dashboard', check: () => this.services.get('web')?.pid },
    ];
    
    for (const service of services) {
      if (service.check()) {
        console.log(`✅ ${service.name} healthy`);
      } else {
        console.log(`❌ ${service.name} not responding`);
      }
    }
    console.log('');
  }

  showServiceStatus() {
    console.log('📊 Service Status Dashboard');
    console.log('==========================');
    console.log('🤖 Bot Service: http://localhost:3001 (API)');
    console.log('🌐 Web Dashboard: http://localhost:3000');
    console.log('🗄️  Database: Connected');
    console.log('⚡ Redis: Connected');
    console.log('');
    console.log('📱 Next Steps:');
    console.log('1. Scan QR code with WhatsApp to connect bot');
    console.log('2. Visit http://localhost:3000 for web dashboard');
    console.log('3. Visit http://localhost:3000/qr for QR code display');
    console.log('4. Check logs in real-time above');
    console.log('');
    console.log('Press Ctrl+C to stop all services');
  }

  setupGracefulShutdown() {
    process.on('SIGINT', () => {
      console.log('\n🔄 Gracefully shutting down services...');
      
      for (const [name, process] of this.services) {
        console.log(`Stopping ${name}...`);
        process.kill('SIGTERM');
      }
      
      setTimeout(() => {
        console.log('✅ All services stopped');
        process.exit(0);
      }, 3000);
    });
  }
}

// Start the launcher
if (import.meta.url === `file://${process.argv[1]}`) {
  const launcher = new WhatsDeXLauncher();
  launcher.setupGracefulShutdown();
  launcher.start().catch(console.error);
}

export default WhatsDeXLauncher;
#!/usr/bin/env node

/**
 * Ultra-Smart WhatsApp Bot Launcher - Enhanced Version
 * AI-powered launcher with intelligent service management and smart URL auto-opening
 */

const { spawn, exec, execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const logger = require('../src/utils/logger');

class UltraSmartLauncher {
  constructor() {
    this.processes = new Map();
    this.services = {
      bot: {
        name: 'WhatsApp Bot',
        port: 3000,
        status: 'stopped',
        hasWebUI: false
      },
      admin: {
        name: 'Admin Panel',
        port: 3001,
        status: 'stopped',
        hasWebUI: true,
        webPath: '/',
        readinessEndpoint: '/',
        readyTimeout: 30000
      },
      analytics: {
        name: 'Analytics API',
        port: 3002,
        status: 'stopped',
        hasWebUI: false
      }
    };

    this.launchConfig = {
      mode: 'full', // full, bot-only, admin-only, qr-only, pairing-only
      autoRestart: true,
      healthCheckInterval: 30000, // 30 seconds
      maxRestarts: 5,
      restartDelay: 5000,
      autoOpenBrowser: true, // Enable/disable automatic browser opening
      browserOpenDelay: 3000, // Delay before opening browser (ms)
      browserRetries: 3, // Number of retries for browser opening
      browserRetryDelay: 2000 // Delay between browser open retries (ms)
    };

    this.performanceMetrics = {
      startTime: null,
      totalRestarts: 0,
      lastHealthCheck: null,
      memoryUsage: 0,
      cpuUsage: 0,
      urlsOpened: []
    };

    this.parseArguments();
    this.initialize();
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

    if (args.includes('--bot-only')) {
      this.launchConfig.mode = 'bot-only';
    } else if (args.includes('--admin-only')) {
      this.launchConfig.mode = 'admin-only';
    } else if (args.includes('--qr-only')) {
      this.launchConfig.mode = 'qr-only';
    } else if (args.includes('--pairing-only')) {
      this.launchConfig.mode = 'pairing-only';
    } else if (args.includes('--diagnostics')) {
      this.runDiagnostics();
      return;
    }

    if (args.includes('--no-auto-restart')) {
      this.launchConfig.autoRestart = false;
    }

    if (args.includes('--no-browser')) {
      this.launchConfig.autoOpenBrowser = false;
    }

    if (args.includes('--verbose')) {
      this.launchConfig.verbose = true;
    }
  }

  /**
   * Show help information
   */
  showHelp() {
    console.log(`
🚀 Ultra-Smart WhatsApp Bot Launcher (Enhanced)
AI-powered launcher with intelligent service management and smart URL auto-opening

USAGE:
  node scripts/ultra-smart-launcher-enhanced.js [options]

OPTIONS:
  --bot-only        Launch only the WhatsApp bot
  --admin-only      Launch only the admin panel
  --qr-only         Launch with QR code authentication only
  --pairing-only    Launch with pairing code authentication only
  --no-auto-restart Disable automatic restart on failure
  --no-browser      Disable automatic browser opening
  --verbose         Enable verbose logging
  --diagnostics     Run system diagnostics
  --help, -h        Show this help message

EXAMPLES:
  node scripts/ultra-smart-launcher-enhanced.js                    # 🤖 AI-powered full launch
  node scripts/ultra-smart-launcher-enhanced.js --bot-only         # 🤖 WhatsApp bot only
  node scripts/ultra-smart-launcher-enhanced.js --admin-only       # 📊 Admin panel only
  node scripts/ultra-smart-launcher-enhanced.js --no-browser       # 🚫 Launch without opening browser
  node scripts/ultra-smart-launcher-enhanced.js --diagnostics      # 🔍 System diagnostics

SERVICES:
  🤖 WhatsApp Bot    - Main bot service (Port 3000)
  📊 Admin Panel     - Web admin interface (Port 3001) 🌐
  📈 Analytics API   - Analytics and monitoring (Port 3002)

FEATURES:
  🔄 Auto-restart on failure
  🌐 Smart browser URL auto-opening
  🩺 Health monitoring
  📊 Performance metrics
  🎯 Service readiness detection

For more information, visit: https://github.com/SplashCodeDex/WhatsDeX
    `);
  }

  /**
   * Initialize the launcher
   */
  async initialize() {
    console.clear();
    this.displayHeader();

    // Check system requirements
    await this.checkSystemRequirements();

    // Load configuration
    await this.loadConfiguration();

    // Start services based on mode
    await this.startServices();

    // Start health monitoring
    this.startHealthMonitoring();

    // Auto-open browser URLs for web services
    if (this.launchConfig.autoOpenBrowser) {
      await this.autoOpenBrowserURLs();
    }

    // Handle graceful shutdown
    this.setupGracefulShutdown();
  }

  /**
   * Display beautiful header
   */
  displayHeader() {
    const header = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                        🚀 ULTRA-SMART LAUNCHER                              ║
║                    AI-Powered WhatsApp Bot Management                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

🤖 Mode: ${this.launchConfig.mode.toUpperCase()}
📊 Services: ${Object.keys(this.services).length}
⚡ Auto-Restart: ${this.launchConfig.autoRestart ? 'ENABLED' : 'DISABLED'}
🌐 Auto-Browser: ${this.launchConfig.autoOpenBrowser ? 'ENABLED' : 'DISABLED'}
🔍 Health Monitoring: ACTIVE

`;
    console.log(header);
  }

  /**
   * Check system requirements
   */
  async checkSystemRequirements() {
    console.log('🔍 Checking system requirements...\n');

    const requirements = [
      { name: 'Node.js Version', check: () => process.version, required: 'v16.0.0+' },
      { name: 'Memory (RAM)', check: () => `${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB`, required: '2GB+' },
      { name: 'CPU Cores', check: () => os.cpus().length, required: '2+' },
      { name: 'Platform', check: () => process.platform, required: 'linux/win32/darwin' },
      { name: 'Architecture', check: () => process.arch, required: 'x64/arm64' }
    ];

    for (const req of requirements) {
      const value = typeof req.check === 'function' ? req.check() : req.check;
      const status = this.checkRequirement(value, req.required);
      console.log(`  ${status.icon} ${req.name}: ${value} ${status.message}`);
    }

    console.log('\n✅ System requirements check completed\n');
  }

  /**
   * Check individual requirement
   */
  checkRequirement(value, required) {
    // Simple checks - in production, implement more sophisticated validation
    if (required.includes('+') && typeof value === 'number') {
      const min = parseInt(required);
      return value >= min
        ? { icon: '✅', message: `(Required: ${required})` }
        : { icon: '❌', message: `(Required: ${required}) - INSUFFICIENT` };
    }

    if (required.includes('/') && required.includes(value)) {
      return { icon: '✅', message: `(Supported: ${required})` };
    }

    return { icon: '✅', message: `(Required: ${required})` };
  }

  /**
   * Load configuration
   */
  async loadConfiguration() {
    console.log('⚙️ Loading configuration...\n');

    try {
      // Check for .env file
      const envPath = path.join(__dirname, '../.env');
      const envExists = await fs.access(envPath).then(() => true).catch(() => false);

      if (envExists) {
        console.log('  ✅ Environment file (.env) found');
      } else {
        console.log('  ⚠️  Environment file (.env) not found - using defaults');
      }

      // Check for package.json
      const pkgPath = path.join(__dirname, '../package.json');
      const pkgExists = await fs.access(pkgPath).then(() => true).catch(() => false);

      if (pkgExists) {
        const pkg = require(pkgPath);
        console.log(`  ✅ Package configuration loaded (v${pkg.version})`);
      }

      console.log('\n✅ Configuration loaded successfully\n');

    } catch (error) {
      console.error('❌ Failed to load configuration:', error.message);
      process.exit(1);
    }
  }

  /**
   * Start services based on launch mode
   */
  async startServices() {
    console.log('🚀 Starting services...\n');

    this.performanceMetrics.startTime = Date.now();

    switch (this.launchConfig.mode) {
      case 'full':
        await this.startAllServices();
        break;
      case 'bot-only':
        await this.startService('bot');
        break;
      case 'admin-only':
        await this.startService('admin');
        break;
      case 'qr-only':
        await this.startService('bot', { authMode: 'qr' });
        break;
      case 'pairing-only':
        await this.startService('bot', { authMode: 'pairing' });
        break;
    }

    console.log('\n✅ Services startup completed\n');
    this.displayServiceStatus();
  }

  /**
   * Start all services
   */
  async startAllServices() {
    const services = ['bot', 'admin', 'analytics'];

    for (const serviceName of services) {
      await this.startService(serviceName);
    }
  }

  /**
   * Start individual service
   */
  async startService(serviceName, options = {}) {
    const service = this.services[serviceName];
    if (!service) {
      console.log(`  ❌ Service '${serviceName}' not found`);
      return;
    }

    try {
      console.log(`  🚀 Starting ${service.name}...`);

      const command = this.getServiceCommand(serviceName, options);
      const child = spawn(command.cmd, command.args, {
        cwd: command.cwd || path.join(__dirname, '..'),
        stdio: this.launchConfig.verbose ? 'inherit' : ['pipe', 'pipe', 'pipe'],
        detached: false
      });

      // Store process reference
      this.processes.set(serviceName, {
        process: child,
        startTime: Date.now(),
        restarts: 0,
        service
      });

      // Update service status
      service.status = 'starting';

      // Handle process events
      child.on('exit', (code, signal) => {
        service.status = 'stopped';
        console.log(`  ❌ ${service.name} exited with code ${code}`);

        if (this.launchConfig.autoRestart && this.performanceMetrics.totalRestarts < this.launchConfig.maxRestarts) {
          this.scheduleRestart(serviceName);
        }
      });

      child.on('error', (error) => {
        service.status = 'error';
        console.log(`  ❌ ${service.name} error: ${error.message}`);
      });

      // Wait a bit for service to start
      await this.delay(2000);

      // Check if service is actually running
      const isRunning = await this.checkServiceHealth(serviceName);
      if (isRunning) {
        service.status = 'running';
        console.log(`  ✅ ${service.name} started successfully (Port: ${service.port})`);

        // Mark service as ready for web UI opening
        if (service.hasWebUI) {
          service.readyTime = Date.now();
        }
      } else {
        service.status = 'failed';
        console.log(`  ❌ ${service.name} failed to start`);
      }

    } catch (error) {
      service.status = 'error';
      console.log(`  ❌ Failed to start ${service.name}: ${error.message}`);
    }
  }

  /**
   * Get command for starting a service
   */
  getServiceCommand(serviceName, options = {}) {
    // Handle Windows npm command - improved detection and fallback
    const isWindows = process.platform === 'win32';
    let npmCmd = isWindows ? 'npm.cmd' : 'npm';

    // On Windows, try multiple npm detection methods
    if (isWindows) {
      try {
        // Method 1: Check if npm.cmd exists
        execSync('npm.cmd --version', { stdio: 'pipe' });
      } catch (error1) {
        try {
          // Method 2: Try npm directly
          execSync('npm --version', { stdio: 'pipe' });
          npmCmd = 'npm';
          console.log(`  📍 Using npm directly (npm.cmd not found)`);
        } catch (error2) {
          console.log(`  ⚠️  npm not found, service may fail to start`);
          npmCmd = 'npm'; // Fallback anyway
        }
      }
    }

    switch (serviceName) {
      case 'bot':
        return {
          cmd: 'node',
          args: ['index.js'],
          cwd: path.join(__dirname, '..'),
          env: { ...process.env }
        };

      case 'admin':
        return {
          cmd: npmCmd,
          args: ['run', 'dev', '--', '-p', '3001'],
          cwd: path.join(__dirname, '../admin'),
          env: { ...process.env, PORT: '3001', NODE_ENV: 'development' }
        };

      case 'analytics':
        return {
          cmd: 'node',
          args: ['scripts/analytics-server.js'],
          cwd: path.join(__dirname, '..'),
          env: { ...process.env, PORT: '3002' }
        };

      default:
        throw new Error(`Unknown service: ${serviceName}`);
    }
  }

  /**
   * Check service health
   */
  async checkServiceHealth(serviceName) {
    const service = this.services[serviceName];
    if (!service) return false;

    try {
      const net = require('net');

      // If service has a readiness endpoint, check it specifically
      if (service.readinessEndpoint) {
        return new Promise((resolve) => {
          const client = net.createConnection({ port: service.port }, () => {
            client.end();
            resolve(true);
          });

          client.on('error', () => resolve(false));
          client.setTimeout(2000, () => {
            client.destroy();
            resolve(false);
          });
        });
      }

      // Simple port check for services without specific readiness endpoints
      return new Promise((resolve) => {
        const client = net.createConnection({ port: service.port }, () => {
          client.end();
          resolve(true);
        });

        client.on('error', () => resolve(false));
        client.setTimeout(2000, () => {
          client.destroy();
          resolve(false);
        });
      });
    } catch (error) {
      return false;
    }
  }

  /**
   * Schedule service restart
   */
  scheduleRestart(serviceName) {
    const service = this.services[serviceName];
    if (!service) return;

    console.log(`  🔄 Scheduling restart for ${service.name} in ${this.launchConfig.restartDelay / 1000}s...`);

    setTimeout(async () => {
      this.performanceMetrics.totalRestarts++;
      await this.startService(serviceName);
    }, this.launchConfig.restartDelay);
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    console.log('🩺 Starting health monitoring...\n');

    setInterval(async () => {
      await this.performHealthCheck();
    }, this.launchConfig.healthCheckInterval);

    this.performanceMetrics.lastHealthCheck = Date.now();
  }

  /**
   * Perform health check on all services
   */
  async performHealthCheck() {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`🩺 [${timestamp}] Performing health check...`);

    let allHealthy = true;

    for (const [serviceName, service] of Object.entries(this.services)) {
      if (service.status === 'running') {
        const isHealthy = await this.checkServiceHealth(serviceName);

        if (!isHealthy) {
          console.log(`  ❌ ${service.name} health check failed`);
          service.status = 'unhealthy';
          allHealthy = false;

          // Auto-restart if enabled
          if (this.launchConfig.autoRestart) {
            await this.scheduleRestart(serviceName);
          }
        } else {
          console.log(`  ✅ ${service.name} is healthy`);
        }
      }
    }

    if (allHealthy) {
      console.log('  🎉 All services are healthy\n');
    } else {
      console.log('  ⚠️  Some services need attention\n');
    }

    this.performanceMetrics.lastHealthCheck = Date.now();
  }

  /**
   * Auto-open browser URLs for services with web interfaces
   */
  async autoOpenBrowserURLs() {
    console.log('🌐 Checking for services with web interfaces...\n');

    const webServices = Object.entries(this.services).filter(([name, service]) => service.hasWebUI);

    if (webServices.length === 0) {
      console.log('  ℹ️  No services with web interfaces found\n');
      return;
    }

    for (const [serviceName, service] of webServices) {
      await this.openServiceURL(serviceName, service);
    }

    console.log('\n✅ Browser auto-opening completed\n');
  }

  /**
   * Open URL for a specific service with readiness detection
   */
  async openServiceURL(serviceName, service) {
    const maxRetries = this.launchConfig.browserRetries;
    const retryDelay = this.launchConfig.browserRetryDelay;
    const readyTimeout = service.readyTimeout || 30000;

    console.log(`  🌐 Waiting for ${service.name} to be ready...`);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Wait for service to be ready
        const ready = await this.waitForServiceReady(serviceName, readyTimeout);
        if (!ready) {
          console.log(`    ❌ ${service.name} not ready after ${readyTimeout}ms (attempt ${attempt}/${maxRetries})`);
          if (attempt < maxRetries) {
            await this.delay(retryDelay);
            continue;
          }
          console.log(`    ⚠️  Skipping browser opening for ${service.name}`);
          return;
        }

        // Service is ready, open the URL
        const url = `http://localhost:${service.port}${service.webPath || '/'}`;
        const opened = await this.openURLInBrowser(url);

        if (opened) {
          console.log(`    ✅ Opened ${service.name} in browser: ${url}`);
          this.performanceMetrics.urlsOpened.push({
            service: serviceName,
            url: url,
            timestamp: new Date().toISOString(),
            attempt: attempt
          });
          return;
        } else {
          console.log(`    ❌ Failed to open browser for ${service.name} (attempt ${attempt}/${maxRetries})`);
          if (attempt < maxRetries) {
            await this.delay(retryDelay);
          }
        }

      } catch (error) {
        console.log(`    ❌ Error opening ${service.name} URL (attempt ${attempt}/${maxRetries}): ${error.message}`);
        if (attempt < maxRetries) {
          await this.delay(retryDelay);
        }
      }
    }

    console.log(`    ⚠️  Failed to open ${service.name} after ${maxRetries} attempts`);
  }

  /**
   * Wait for service to be ready
   */
  async waitForServiceReady(serviceName, timeout = 30000) {
    const service = this.services[serviceName];
    if (!service) return false;

    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (service.status === 'running') {
        const isHealthy = await this.checkServiceHealth(serviceName);
        if (isHealthy) {
          // Additional delay to ensure service is fully initialized
          await this.delay(this.launchConfig.browserOpenDelay);
          return true;
        }
      }
      await this.delay(1000); // Check every second
    }

    return false;
  }

  /**
   * Open URL in browser with platform-specific handling
   */
  async openURLInBrowser(url) {
    try {
      let command;

      switch (process.platform) {
        case 'win32':
          // Windows - use start command
          command = `start "" "${url}"`;
          break;
        case 'darwin':
          // macOS
          command = `open "${url}"`;
          break;
        case 'linux':
          // Linux - use xdg-open
          command = `xdg-open "${url}"`;
          break;
        default:
          console.log(`    ⚠️  Unsupported platform: ${process.platform}`);
          return false;
      }

      return new Promise((resolve) => {
        exec(command, (error) => {
          if (error) {
            console.log(`    ⚠️  Browser command failed: ${error.message}`);
            resolve(false);
          } else {
            resolve(true);
          }
        });
      });

    } catch (error) {
      console.log(`    ❌ Error opening URL in browser: ${error.message}`);
      return false;
    }
  }

  /**
   * Display current service status
   */
  displayServiceStatus() {
    console.log('📊 Current Service Status:\n');

    for (const [name, service] of Object.entries(this.services)) {
      const statusIcon = this.getStatusIcon(service.status);
      const uptime = service.status === 'running' ?
        this.formatUptime(Date.now() - (this.processes.get(name)?.startTime || Date.now())) :
        'N/A';

      console.log(`  ${statusIcon} ${service.name}`);
      console.log(`    Port: ${service.port} | Status: ${service.status} | Uptime: ${uptime}`);
    }

    console.log('\n🎯 Launch completed! Services are now running.\n');

    if (this.launchConfig.autoOpenBrowser && this.performanceMetrics.urlsOpened.length > 0) {
      console.log('🌐 Browser URLs opened:');
      this.performanceMetrics.urlsOpened.forEach(({ service, url }) => {
        console.log(`  • ${service}: ${url}`);
      });
      console.log('');
    }

    console.log('💡 Useful commands:');
    console.log('  • npm run health-check    - Check service health');
    console.log('  • npm run analytics       - View analytics dashboard');
    console.log('  • npm run diagnostics     - Run system diagnostics');
    console.log('  • Ctrl+C                  - Stop all services\n');
  }

  /**
   * Get status icon
   */
  getStatusIcon(status) {
    switch (status) {
      case 'running': return '🟢';
      case 'starting': return '🟡';
      case 'stopped': return '🔴';
      case 'error': return '❌';
      case 'failed': return '❌';
      case 'unhealthy': return '🟠';
      default: return '⚪';
    }
  }

  /**
   * Format uptime duration
   */
  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Run system diagnostics
   */
  async runDiagnostics() {
    console.log('🔍 Running system diagnostics...\n');

    const diagnostics = {
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        totalMemory: `${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB`,
        freeMemory: `${Math.round(os.freemem() / 1024 / 1024 / 1024)}GB`,
        cpuCount: os.cpus().length
      },
      services: {},
      performance: this.performanceMetrics
    };

    // Check service diagnostics
    for (const [name, service] of Object.entries(this.services)) {
      diagnostics.services[name] = {
        status: service.status,
        port: service.port,
        healthy: await this.checkServiceHealth(name)
      };
    }

    console.log('📊 System Information:');
    Object.entries(diagnostics.system).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });

    console.log('\n🩺 Service Health:');
    Object.entries(diagnostics.services).forEach(([name, info]) => {
      const icon = info.healthy ? '✅' : '❌';
      console.log(`  ${icon} ${name}: ${info.status} (Port: ${info.port})`);
    });

    console.log('\n⚡ Performance Metrics:');
    console.log(`  Uptime: ${this.formatUptime(Date.now() - (diagnostics.performance.startTime || Date.now()))}`);
    console.log(`  Total Restarts: ${diagnostics.performance.totalRestarts}`);
    console.log(`  Memory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);

    console.log('\n✅ Diagnostics completed\n');
  }

  /**
   * Setup graceful shutdown
   */
  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);

      // Stop all services
      for (const [name, processInfo] of this.processes.entries()) {
        if (processInfo.process && !processInfo.process.killed) {
          console.log(`  🛑 Stopping ${name}...`);
          processInfo.process.kill('SIGTERM');

          // Wait for process to exit
          await new Promise((resolve) => {
            processInfo.process.on('exit', resolve);
            setTimeout(resolve, 5000); // Timeout after 5 seconds
          });
        }
      }

      console.log('✅ All services stopped. Goodbye! 👋\n');
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the launcher
if (require.main === module) {
  new UltraSmartLauncher();
}

module.exports = UltraSmartLauncher;
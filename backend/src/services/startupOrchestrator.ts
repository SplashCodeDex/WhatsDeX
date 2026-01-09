/**
 * STARTUP ORCHESTRATOR - Proper service startup sequence
 * Ensures all dependencies are healthy before starting dependent services
 */

export class StartupOrchestrator {
  constructor() {
    this.services = new Map();
    this.dependencies = new Map();
    this.startupOrder = [];
  }

  registerService(name, factory, dependencies = []) {
    this.services.set(name, {
      name,
      factory,
      dependencies,
      instance: null,
      status: 'not_started',
      healthCheck: null
    });
    
    this.dependencies.set(name, dependencies);
  }

  setHealthCheck(serviceName, healthCheckFn) {
    const service = this.services.get(serviceName);
    if (service) {
      service.healthCheck = healthCheckFn;
    }
  }

  async startAllServices() {
    console.log('🚀 Starting service orchestration...');
    
    // Calculate startup order based on dependencies
    this.calculateStartupOrder();
    
    for (const serviceName of this.startupOrder) {
      await this.startService(serviceName);
    }
    
    console.log('✅ All services started successfully!');
  }

  async startService(serviceName) {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }

    if (service.status === 'running') {
      return service.instance;
    }

    console.log(`🔄 Starting service: ${serviceName}`);

    // Wait for dependencies
    await this.waitForDependencies(serviceName);

    try {
      // Start the service
      service.status = 'starting';
      service.instance = await service.factory();
      service.status = 'running';
      
      // Verify health
      if (service.healthCheck) {
        await this.verifyHealth(serviceName);
      }
      
      console.log(`✅ Service started: ${serviceName}`);
      return service.instance;
      
    } catch (error: any) {
      service.status = 'failed';
      console.error(`❌ Service startup failed: ${serviceName}`, error.message);
      throw error;
    }
  }

  async waitForDependencies(serviceName) {
    const dependencies = this.dependencies.get(serviceName) || [];
    
    for (const depName of dependencies) {
      console.log(`⏳ Waiting for dependency: ${depName}`);
      await this.startService(depName);
      
      // Verify dependency is healthy
      await this.verifyHealth(depName);
    }
  }

  async verifyHealth(serviceName) {
    const service = this.services.get(serviceName);
    if (!service || !service.healthCheck) return true;

    const maxRetries = 10;
    const retryDelay = 2000;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const isHealthy = await service.healthCheck(service.instance);
        if (isHealthy) {
          console.log(`✅ Health check passed: ${serviceName}`);
          return true;
        }
      } catch (error: any) {
        console.warn(`⚠️ Health check failed for ${serviceName}: ${error.message}`);
      }

      if (i < maxRetries - 1) {
        console.log(`🔄 Retrying health check for ${serviceName} in ${retryDelay/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    throw new Error(`Health check failed for ${serviceName} after ${maxRetries} attempts`);
  }

  calculateStartupOrder() {
    const visited = new Set();
    const visiting = new Set();
    const order = [];

    const visit = (serviceName) => {
      if (visiting.has(serviceName)) {
        throw new Error(`Circular dependency detected: ${serviceName}`);
      }
      
      if (visited.has(serviceName)) {
        return;
      }

      visiting.add(serviceName);
      
      const dependencies = this.dependencies.get(serviceName) || [];
      for (const dep of dependencies) {
        visit(dep);
      }
      
      visiting.delete(serviceName);
      visited.add(serviceName);
      order.push(serviceName);
    };

    for (const serviceName of this.services.keys()) {
      visit(serviceName);
    }

    this.startupOrder = order;
    console.log('📋 Calculated startup order:', order);
  }

  getServiceStatus() {
    const status = {};
    for (const [name, service] of this.services) {
      status[name] = service.status;
    }
    return status;
  }

  async stopAllServices() {
    console.log('🔄 Stopping all services...');
    
    // Stop in reverse order
    const reverseOrder = [...this.startupOrder].reverse();
    
    for (const serviceName of reverseOrder) {
      try {
        const service = this.services.get(serviceName);
        if (service && service.instance && typeof service.instance.stop === 'function') {
          console.log(`🛑 Stopping service: ${serviceName}`);
          await service.instance.stop();
          service.status = 'stopped';
        }
      } catch (error: any) {
        console.error(`Error stopping ${serviceName}:`, error.message);
      }
    }
    
    console.log('✅ All services stopped');
  }
}

export default StartupOrchestrator;

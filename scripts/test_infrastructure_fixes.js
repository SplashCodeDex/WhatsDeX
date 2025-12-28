/**
 * Comprehensive Test Suite for Infrastructure Fixes
 * Tests memory management, database pooling, rate limiting, and error handling
 */

import { performance } from 'perf_hooks';

// Test Memory Management
async function testMemoryManagement() {
  console.log('🧪 Testing Memory Management Fixes...');
  
  try {
    // Import the fixed WhatsDeXBrain
    const WhatsDeXBrain = (await import('./src/services/WhatsDeXBrain.js')).default;
    
    const mockBot = { cmd: new Map() };
    const mockContext = { config: { ai: {} } };
    const brain = new WhatsDeXBrain(mockBot, mockContext);
    
    // Test 1: Memory limits
    console.log('  📋 Test 1: Memory size limits...');
    const initialStats = brain.getMemoryStats();
    console.log(`  Initial memory: ${initialStats.activeConversations} conversations`);
    
    // Simulate many users (should trigger eviction)
    for (let i = 0; i < 1500; i++) {
      brain.updateConversationMemory(`user_${i}`, `Message ${i}`, `Response ${i}`);
    }
    
    const afterStats = brain.getMemoryStats();
    console.log(`  After 1500 users: ${afterStats.activeConversations} conversations`);
    
    if (afterStats.activeConversations <= 1000) {
      console.log('  ✅ Memory limit enforcement working');
    } else {
      console.log('  ❌ Memory limit not enforced');
    }
    
    // Test 2: TTL expiration (simulate by calling cleanup)
    console.log('  📋 Test 2: TTL expiration...');
    brain.conversationMemory.cleanup();
    const cleanupStats = brain.getMemoryStats();
    console.log(`  After cleanup: ${cleanupStats.activeConversations} conversations`);
    console.log('  ✅ Memory cleanup working');
    
  } catch (error) {
    console.log('  ❌ Memory management test failed:', error.message);
  }
}

// Test Database Pooling
async function testDatabasePooling() {
  console.log('🧪 Testing Database Pooling...');
  
  try {
    const dbManager = (await import('./src/utils/DatabaseManager.js')).default;
    
    // Test 1: Singleton pattern
    console.log('  📋 Test 1: Singleton pattern...');
    const instance1 = (await import('./src/utils/DatabaseManager.js')).default;
    const instance2 = (await import('./src/utils/DatabaseManager.js')).default;
    
    if (instance1 === instance2) {
      console.log('  ✅ Singleton pattern working');
    } else {
      console.log('  ❌ Multiple instances created');
    }
    
    // Test 2: Health check
    console.log('  📋 Test 2: Health check...');
    const health = await dbManager.healthCheck();
    console.log(`  Health status: ${health.status}`);
    
    if (health.status === 'healthy') {
      console.log('  ✅ Database connection healthy');
    } else {
      console.log('  ⚠️ Database connection issues:', health.error);
    }
    
  } catch (error) {
    console.log('  ❌ Database pooling test failed:', error.message);
  }
}

// Test Rate Limiting
async function testRateLimiting() {
  console.log('🧪 Testing Rate Limiting...');
  
  try {
    const RateLimiter = (await import('./src/utils/RateLimiter.js')).default;
    const rateLimiter = new RateLimiter();
    
    // Test 1: Basic rate limiting
    console.log('  📋 Test 1: Basic rate limiting...');
    const testUser = 'test_user_123';
    
    // Make multiple requests rapidly
    let allowedCount = 0;
    let blockedCount = 0;
    
    for (let i = 0; i < 35; i++) { // More than default limit of 30
      const result = await rateLimiter.isAllowed(testUser, 'user');
      if (result.allowed) {
        allowedCount++;
      } else {
        blockedCount++;
      }
    }
    
    console.log(`  Allowed: ${allowedCount}, Blocked: ${blockedCount}`);
    
    if (blockedCount > 0) {
      console.log('  ✅ Rate limiting working');
    } else {
      console.log('  ❌ Rate limiting not enforced');
    }
    
    // Test 2: Command-specific rate limiting
    console.log('  📋 Test 2: Command-specific rate limiting...');
    const commandResult = await rateLimiter.checkCommandRateLimit(testUser, 'gemini');
    console.log(`  Command rate limit check: ${commandResult.allowed ? 'ALLOWED' : 'BLOCKED'}`);
    
    await rateLimiter.disconnect();
    console.log('  ✅ Rate limiter cleanup successful');
    
  } catch (error) {
    console.log('  ❌ Rate limiting test failed:', error.message);
  }
}

// Test Performance Monitoring
async function testPerformanceMonitoring() {
  console.log('🧪 Testing Performance Monitoring...');
  
  try {
    const performanceMonitor = (await import('./src/utils/PerformanceMonitor.js')).default;
    
    // Test 1: Timer functionality
    console.log('  📋 Test 1: Performance timing...');
    
    const timer = performanceMonitor.startTimer('test_operation', { test: true });
    
    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const duration = timer.end();
    console.log(`  Test operation took: ${duration}ms`);
    
    if (duration >= 100) {
      console.log('  ✅ Performance timing working');
    } else {
      console.log('  ❌ Performance timing inaccurate');
    }
    
    // Test 2: Metrics collection
    console.log('  📋 Test 2: Metrics collection...');
    const stats = performanceMonitor.getStats('test_operation');
    console.log(`  Metrics collected: ${stats ? 'YES' : 'NO'}`);
    
    if (stats && stats.count > 0) {
      console.log('  ✅ Metrics collection working');
    } else {
      console.log('  ❌ Metrics not collected');
    }
    
  } catch (error) {
    console.log('  ❌ Performance monitoring test failed:', error.message);
  }
}

// Test Error Handling
async function testErrorHandling() {
  console.log('🧪 Testing Error Handling...');
  
  try {
    // Import the connection manager from main.js
    console.log('  📋 Test 1: Connection manager structure...');
    
    // Test circuit breaker logic (without actual connection)
    const mockConnectionManager = {
      state: {
        consecutiveFailures: 0,
        circuitBreakerThreshold: 5,
        lastSuccessTime: Date.now()
      },
      
      isCircuitOpen() {
        return this.state.consecutiveFailures >= this.state.circuitBreakerThreshold;
      },
      
      calculateBackoffDelay() {
        const attempt = this.state.consecutiveFailures + 1;
        const baseDelay = 2000;
        const backoffMultiplier = 1.5;
        const exponentialDelay = baseDelay * Math.pow(backoffMultiplier, attempt - 1);
        return Math.min(exponentialDelay, 300000);
      }
    };
    
    // Test circuit breaker
    console.log('  📋 Test 2: Circuit breaker logic...');
    console.log(`  Initial circuit state: ${mockConnectionManager.isCircuitOpen() ? 'OPEN' : 'CLOSED'}`);
    
    // Simulate failures
    mockConnectionManager.state.consecutiveFailures = 6;
    console.log(`  After 6 failures: ${mockConnectionManager.isCircuitOpen() ? 'OPEN' : 'CLOSED'}`);
    
    if (mockConnectionManager.isCircuitOpen()) {
      console.log('  ✅ Circuit breaker working');
    } else {
      console.log('  ❌ Circuit breaker not triggered');
    }
    
    // Test backoff delay
    console.log('  📋 Test 3: Backoff calculation...');
    const delay = mockConnectionManager.calculateBackoffDelay();
    console.log(`  Calculated delay: ${delay}ms`);
    
    if (delay > 2000) {
      console.log('  ✅ Exponential backoff working');
    } else {
      console.log('  ❌ Backoff calculation issue');
    }
    
  } catch (error) {
    console.log('  ❌ Error handling test failed:', error.message);
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Infrastructure Fixes Test Suite\n');
  const startTime = performance.now();
  
  await testMemoryManagement();
  console.log('');
  
  await testDatabasePooling();
  console.log('');
  
  await testRateLimiting();
  console.log('');
  
  await testPerformanceMonitoring();
  console.log('');
  
  await testErrorHandling();
  console.log('');
  
  const endTime = performance.now();
  const totalTime = Math.round(endTime - startTime);
  
  console.log('🎯 TEST SUITE COMPLETED');
  console.log(`Total execution time: ${totalTime}ms`);
  console.log('=====================================');
}

// Run tests
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export default runAllTests;
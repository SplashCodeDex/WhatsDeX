// lib/connectionManager.js
import { Result } from '../types/index.js';

interface ConnectionState {
  isReconnecting: boolean;
  attemptCount: number;
  consecutiveFailures: number;
  lastError: Error | null;
  lastSuccessTime: number;
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
  lastDisconnected?: number;
  totalSuccessfulReconnections?: number;
  totalReconnectionTime?: number;
}

interface ConnectionConfig {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  circuitBreakerThreshold?: number;
  circuitBreakerTimeout?: number;
}

class ConnectionManager {
  private state: ConnectionState;
  private reconnectionTimeout: NodeJS.Timeout | null;
  private reconnectFn: (() => Promise<any>) | null = null;

  constructor(config: ConnectionConfig = {}) {
    this.state = {
      isReconnecting: false,
      attemptCount: 0,
      consecutiveFailures: 0,
      lastError: null,
      lastSuccessTime: Date.now(),
      maxRetries: config.maxRetries || 10,
      baseDelay: config.baseDelay || 2000,
      maxDelay: config.maxDelay || 300000,
      backoffMultiplier: config.backoffMultiplier || 1.5,
      circuitBreakerThreshold: config.circuitBreakerThreshold || 5,
      circuitBreakerTimeout: config.circuitBreakerTimeout || 600000, // 10 minutes
    };
    this.reconnectionTimeout = null;
  }

  async handleReconnection(error: unknown, context: any): Promise<Result<void>> {
    const err = error instanceof Error ? error : new Error(String(error));

    // Circuit breaker check
    if (this.isCircuitOpen()) {
      console.log('⚡ Circuit breaker OPEN - waiting before retry');
      await this.waitForCircuitReset();
    }

    // Check max retries BEFORE incrementing
    if (this.state.attemptCount >= this.state.maxRetries) {
      console.error('💀 Max reconnection attempts reached. Manual intervention required.');
      return { success: false, error: new Error(`Connection failed after ${this.state.maxRetries} attempts`) };
    }

    // Increment attempt count
    this.state.attemptCount++;
    this.state.consecutiveFailures++;
    this.state.isReconnecting = true;
    this.state.lastError = err;

    const delay = this.calculateBackoffDelay();

    // Show correct attempt numbers
    console.log(
      `🔄 Reconnection attempt ${this.state.attemptCount}/${this.state.maxRetries} in ${Math.round(delay)}ms`
    );
    console.log(`❌ Last error: ${err.message}`);
    console.log(
      `📊 Total failures: ${this.state.consecutiveFailures}, Success rate: ${(((this.state.attemptCount - this.state.consecutiveFailures) / this.state.attemptCount) * 100).toFixed(1)}%`
    );

    // Clear any existing timeout
    if (this.reconnectionTimeout) {
      clearTimeout(this.reconnectionTimeout);
    }

    try {
      // Wait with proper delay
      await new Promise(resolve => {
        this.reconnectionTimeout = setTimeout(resolve, delay);
      });

      console.log(`⚡ Executing reconnection attempt ${this.state.attemptCount}...`);

      // Try reconnection
      await this.attemptReconnection(context);

      // Reset state on success
      this.onReconnectionSuccess();
      return { success: true, data: undefined };
    } catch (reconnectionError: unknown) {
      const recErr = reconnectionError instanceof Error ? reconnectionError : new Error(String(reconnectionError));
      console.error(
        `🔥 Reconnection attempt ${this.state.attemptCount} failed:`,
        recErr.message
      );

      // Check if we should continue trying
      if (this.state.attemptCount < this.state.maxRetries) {
        console.log(
          `🔄 Will retry... (${this.state.maxRetries - this.state.attemptCount} attempts remaining)`
        );
        return this.handleReconnection(recErr, context);
      } else {
        this.onReconnectionFailure();
        return { success: false, error: recErr };
      }
    }
  }

  setReconnector(reconnectFn: () => Promise<any>) {
    this.reconnectFn = reconnectFn;
  }

  async attemptReconnection(context: any): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Reconnection timeout'));
      }, 60000); // Increased to 60s for full startup

      try {
        if (!this.reconnectFn) {
          throw new Error('Reconnector function not set');
        }

        // Clean up previous bot instance if exists
        if (context.bot) {
          try {
            if (typeof context.bot.end === 'function') context.bot.end(undefined);
            context.bot = null;
          } catch (cleanupError: unknown) {
            const cleanErr = cleanupError instanceof Error ? cleanupError : new Error(String(cleanupError));
            console.warn('⚠️  Cleanup warning:', cleanErr.message);
          }
        }

        console.log('⚡ Executing reconnection callback...');
        const newBot = await this.reconnectFn();

        clearTimeout(timeout);
        resolve(newBot);
      } catch (error: unknown) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  calculateBackoffDelay(): number {
    const exponentialDelay =
      this.state.baseDelay * Math.pow(this.state.backoffMultiplier, this.state.attemptCount - 1);
    const jitterDelay = exponentialDelay * (0.5 + Math.random() * 0.5); // Add jitter
    return Math.min(jitterDelay, this.state.maxDelay);
  }

  isCircuitOpen(): boolean {
    return (
      this.state.consecutiveFailures >= this.state.circuitBreakerThreshold &&
      Date.now() - this.state.lastSuccessTime > this.state.circuitBreakerTimeout
    );
  }

  async waitForCircuitReset(): Promise<void> {
    const waitTime = Math.min(
      this.state.circuitBreakerTimeout - (Date.now() - this.state.lastSuccessTime),
      300000 // Max 5 minutes
    );

    if (waitTime > 0) {
      console.log(`⏳ Circuit breaker cooling down for ${Math.round(waitTime / 1000)}s`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  onReconnectionSuccess(): void {
    const totalAttempts = this.state.attemptCount;
    const reconnectionTime = this.state.lastDisconnected
      ? Date.now() - this.state.lastDisconnected
      : 0;

    console.log(`✅ Reconnection successful after ${totalAttempts} attempts`);
    if (reconnectionTime > 0) {
      console.log(`⏱️  Total reconnection time: ${Math.round(reconnectionTime / 1000)}s`);
    }

    // Track statistics before resetting
    this.state.totalSuccessfulReconnections = (this.state.totalSuccessfulReconnections || 0) + 1;
    this.state.totalReconnectionTime = (this.state.totalReconnectionTime || 0) + reconnectionTime;

    // Reset reconnection state
    this.state.isReconnecting = false;
    this.state.attemptCount = 0;
    this.state.consecutiveFailures = 0;
    this.state.lastError = null;
    this.state.lastSuccessTime = Date.now();

    if (this.reconnectionTimeout) {
      clearTimeout(this.reconnectionTimeout);
      this.reconnectionTimeout = null;
    }

    // Log success statistics
    const avgReconnectionTime =
      (this.state.totalReconnectionTime || 0) / (this.state.totalSuccessfulReconnections || 1);
    console.log(
      `📈 Reconnection stats: ${this.state.totalSuccessfulReconnections} successful, avg time: ${Math.round(avgReconnectionTime / 1000)}s`
    );
  }

  onReconnectionFailure(): void {
    console.error('💀 All reconnection attempts failed');
    this.state.isReconnecting = false;

    if (this.reconnectionTimeout) {
      clearTimeout(this.reconnectionTimeout);
      this.reconnectionTimeout = null;
    }
  }

  getStatus() {
    return {
      ...this.state,
      circuitOpen: this.isCircuitOpen(),
      nextRetryIn: this.reconnectionTimeout ? 'Pending' : 'None',
    };
  }
}

export default ConnectionManager;
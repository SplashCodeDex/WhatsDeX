import { EventEmitter } from 'events';
import logger from '../utils/logger.js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Automated Reconnection Engine
 * AI-powered reconnection with intelligent retry logic
 */
class AutoReconnectionEngine extends EventEmitter {
  private maxRetries: number;
  private baseDelay: number;
  private maxDelay: number;
  private backoffMultiplier: number;
  private jitterFactor: number;
  private connectionState: {
    isConnected: boolean;
    lastConnected: number | null;
    lastDisconnected: number | null;
    disconnectReason: any;
    retryCount: number;
    totalRetries: number;
    successRate: number;
    averageReconnectionTime: number;
  };
  private learningData: {
    successfulStrategies: any[];
    failedStrategies: any[];
    networkPatterns: Map<string, any>;
    timePatterns: Map<string, any>;
    devicePatterns: Map<string, any>;
  };
  private reconnectHandler: any;
  private qrRefreshHandler: any;
  private pairingCodeHandler: any;
  private deviceCheckHandler: any;
  private networkCheckHandler: any;
  private activeAttempts: Map<string, any>;
  private reconnectionTimers: Map<string, any>;

  constructor(options: any = {}) {
    super();

    this.maxRetries = options.maxRetries || 10;
    this.baseDelay = options.baseDelay || 1000; // 1 second
    this.maxDelay = options.maxDelay || 300000; // 5 minutes
    this.backoffMultiplier = options.backoffMultiplier || 2;
    this.jitterFactor = options.jitterFactor || 0.1;

    // Connection state tracking
    this.connectionState = {
      isConnected: false,
      lastConnected: null,
      lastDisconnected: null,
      disconnectReason: null,
      retryCount: 0,
      totalRetries: 0,
      successRate: 1.0,
      averageReconnectionTime: 0,
    };

    // AI learning data
    this.learningData = {
      successfulStrategies: [],
      failedStrategies: [],
      networkPatterns: new Map(),
      timePatterns: new Map(),
      devicePatterns: new Map(),
    };

    // Handlers to integrate real reconnection flows
    this.reconnectHandler = options.reconnectHandler;
    this.qrRefreshHandler = options.qrRefreshHandler;
    this.pairingCodeHandler = options.pairingCodeHandler;
    this.deviceCheckHandler = options.deviceCheckHandler;
    this.networkCheckHandler = options.networkCheckHandler;

    // Active reconnection attempts
    this.activeAttempts = new Map();
    this.reconnectionTimers = new Map();

    this.loadLearningData();
    logger.info('Auto Reconnection Engine initialized with AI learning capabilities');
  }

  /**
   * Load AI learning data from persistent storage
   */
  async loadLearningData() {
    try {
      const learningFile = path.join(__dirname, '../../.whatsdex-reconnection-learning.json');
      const data = await fs.readFile(learningFile, 'utf8');
      this.learningData = { ...this.learningData, ...JSON.parse(data) };
      logger.info('Reconnection learning data loaded');
    } catch (error: any) {
      logger.info('No existing reconnection learning data found');
    }
  }

  /**
   * Save AI learning data to persistent storage
   */
  async saveLearningData() {
    try {
      const learningFile = path.join(__dirname, '../../.whatsdex-reconnection-learning.json');
      await fs.writeFile(learningFile, JSON.stringify(this.learningData, null, 2));
    } catch (error: any) {
      logger.error('Failed to save reconnection learning data', { error: error.message });
    }
  }

  /**
   * Handle disconnection and initiate reconnection
   */
  async handleDisconnection(reason: any, context: any = {}) {
    const disconnectionId = randomUUID();
    const timestamp = Date.now();

    logger.warn('Disconnection detected', {
      disconnectionId,
      reason,
      context,
      currentState: this.connectionState,
    });

    // Update connection state
    this.connectionState.isConnected = false;
    this.connectionState.lastDisconnected = timestamp;
    this.connectionState.disconnectReason = reason;

    // Analyze disconnection reason
    const analysis = await this.analyzeDisconnection(reason, context);

    // Emit disconnection event
    this.emit('disconnection', {
      id: disconnectionId,
      reason,
      analysis,
      timestamp,
    });

    // Start reconnection process
    await this.initiateReconnection(disconnectionId, analysis, context);

    return disconnectionId;
  }

  /**
   * Analyze disconnection reason using AI
   */
  async analyzeDisconnection(reason: any, context: any) {
    const analysis = {
      type: this.categorizeDisconnection(reason),
      severity: this.assessSeverity(reason),
      likelyCauses: await this.identifyCauses(reason, context),
      recommendedStrategy: await this.recommendStrategy(reason, context),
      estimatedRecoveryTime: this.estimateRecoveryTime(reason),
      confidence: 0.8,
    };

    logger.info('Disconnection analyzed', { reason, analysis });

    return analysis;
  }

  /**
   * Categorize disconnection type
   */
  categorizeDisconnection(reason: any) {
    const reasonStr = reason?.toString().toLowerCase() || '';

    if (
      reasonStr.includes('network') ||
      reasonStr.includes('timeout') ||
      reasonStr.includes('connection')
    ) {
      return 'network';
    }
    if (
      reasonStr.includes('auth') ||
      reasonStr.includes('login') ||
      reasonStr.includes('session')
    ) {
      return 'authentication';
    }
    if (reasonStr.includes('device') || reasonStr.includes('phone')) {
      return 'device';
    }
    if (reasonStr.includes('server') || reasonStr.includes('maintenance')) {
      return 'server';
    }
    if (reasonStr.includes('rate') || reasonStr.includes('limit')) {
      return 'rate_limit';
    }
    return 'unknown';
  }

  /**
   * Assess severity of disconnection
   */
  assessSeverity(reason: any) {
    const reasonStr = reason?.toString().toLowerCase() || '';

    if (reasonStr.includes('banned') || reasonStr.includes('blocked')) {
      return 'critical';
    }
    if (reasonStr.includes('auth') || reasonStr.includes('login')) {
      return 'high';
    }
    if (reasonStr.includes('network') || reasonStr.includes('timeout')) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Identify likely causes of disconnection
   */
  async identifyCauses(reason: any, context: any) {
    const causes = [];
    const reasonStr = reason?.toString().toLowerCase() || '';

    // Network-related causes
    if (reasonStr.includes('network') || reasonStr.includes('timeout')) {
      causes.push('Network connectivity issues');
      causes.push('WiFi signal weakness');
      causes.push('Mobile data instability');
    }

    // Authentication causes
    if (reasonStr.includes('auth') || reasonStr.includes('login')) {
      causes.push('Session token expired');
      causes.push('Device verification required');
      causes.push('Account security measures');
    }

    // Device causes
    if (reasonStr.includes('device') || reasonStr.includes('phone')) {
      causes.push('Device offline');
      causes.push('Battery optimization');
      causes.push('App background restrictions');
    }

    // Server causes
    if (reasonStr.includes('server')) {
      causes.push('WhatsApp server maintenance');
      causes.push('Regional server issues');
      causes.push('API rate limiting');
    }

    // Learn from context
    if (context.networkType) {
      causes.push(`Network type: ${context.networkType}`);
    }

    if (context.deviceType) {
      causes.push(`Device type: ${context.deviceType}`);
    }

    return causes;
  }

  /**
   * Recommend reconnection strategy using AI
   */
  async recommendStrategy(reason: any, context: any) {
    // Get historical success rates for different strategies
    const historicalSuccess = await this.getHistoricalSuccessRates(reason, context);

    // Consider current conditions
    const currentConditions = this.assessCurrentConditions(context);

    // AI-powered strategy selection
    const strategy = this.selectOptimalStrategy(historicalSuccess, currentConditions);

    logger.info('Reconnection strategy recommended', {
      reason,
      strategy,
      historicalSuccess,
      currentConditions,
    });

    return strategy;
  }

  /**
   * Get historical success rates for reconnection strategies
   */
  async getHistoricalSuccessRates(reason: any, context: any) {
    const reasonType = this.categorizeDisconnection(reason);
    const successfulStrategies = this.learningData.successfulStrategies
      .filter(s => s.reasonType === reasonType)
      .slice(-20); // Last 20 successful reconnections

    const strategyCounts: Record<string, number> = {};
    successfulStrategies.forEach(s => {
      strategyCounts[s.strategy] = (strategyCounts[s.strategy] || 0) + 1;
    });

    // Calculate success rates
    const totalStrategies = successfulStrategies.length;
    const successRates: Record<string, number> = {};

    Object.keys(strategyCounts).forEach(strategy => {
      successRates[strategy] = strategyCounts[strategy] / totalStrategies;
    });

    return successRates;
  }

  /**
   * Assess current connection conditions
   */
  assessCurrentConditions(context: any) {
    const conditions = {
      networkQuality: this.assessNetworkQuality(context),
      deviceStatus: this.assessDeviceStatus(context),
      timeOfDay: this.getTimeOfDay(),
      serverLoad: 'unknown', // Would be determined by monitoring
      userActivity: context.userActivity || 'unknown',
    };

    return conditions;
  }

  /**
   * Select optimal reconnection strategy
   */
  selectOptimalStrategy(historicalSuccess: Record<string, number>, currentConditions: any) {
    // Find strategy with highest historical success rate
    let bestStrategy = 'immediate_retry';
    let bestScore = 0;

    Object.entries(historicalSuccess).forEach(([strategy, successRate]) => {
      const score = successRate * this.calculateConditionMultiplier(strategy, currentConditions);
      if (score > bestScore) {
        bestStrategy = strategy;
        bestScore = score;
      }
    });

    return bestStrategy;
  }

  /**
   * Calculate condition multiplier for strategy scoring
   */
  calculateConditionMultiplier(strategy: string, conditions: any) {
    let multiplier = 1.0;

    // Network quality multiplier
    if (conditions.networkQuality === 'poor' && strategy.includes('immediate')) {
      multiplier *= 0.5;
    }

    // Time of day multiplier
    if (conditions.timeOfDay === 'night' && strategy.includes('notification')) {
      multiplier *= 1.2;
    }

    // Device status multiplier
    if (conditions.deviceStatus === 'offline' && strategy.includes('device')) {
      multiplier *= 1.3;
    }

    return multiplier;
  }

  /**
   * Estimate recovery time
   */
  estimateRecoveryTime(reason: any) {
    const reasonType = this.categorizeDisconnection(reason);

    const estimates: Record<string, { min: number, max: number, average: number }> = {
      network: { min: 5000, max: 30000, average: 15000 },
      authentication: { min: 10000, max: 120000, average: 60000 },
      device: { min: 30000, max: 300000, average: 120000 },
      server: { min: 60000, max: 600000, average: 300000 },
      rate_limit: { min: 60000, max: 3600000, average: 600000 },
      unknown: { min: 10000, max: 60000, average: 30000 },
    };

    return estimates[reasonType] || estimates.unknown;
  }

  /**
   * Initiate reconnection process
   */
  async initiateReconnection(disconnectionId: string, analysis: any, context: any) {
    const attemptId = randomUUID();

    logger.info('Initiating reconnection', {
      disconnectionId,
      attemptId,
      strategy: analysis.recommendedStrategy,
      estimatedRecovery: analysis.estimatedRecoveryTime.average,
    });

    // Create reconnection attempt
    const attempt = {
      id: attemptId,
      disconnectionId,
      strategy: analysis.recommendedStrategy,
      startTime: Date.now(),
      status: 'starting',
      retryCount: 0,
      maxRetries: this.calculateMaxRetries(analysis),
      analysis,
    };

    this.activeAttempts.set(attemptId, attempt);

    // Emit reconnection start event
    this.emit('reconnection_start', attempt);

    // Execute reconnection strategy
    await this.executeReconnectionStrategy(attempt, context);

    return attemptId;
  }

  /**
   * Calculate maximum retries based on analysis
   */
  calculateMaxRetries(analysis: any) {
    const baseRetries: Record<string, number> = {
      critical: 1,
      high: 3,
      medium: 5,
      low: 10,
    };

    return Math.min(baseRetries[analysis.severity] || 5, this.maxRetries);
  }

  /**
   * Execute reconnection strategy
   */
  async executeReconnectionStrategy(attempt: any, context: any) {
    const { strategy } = attempt;

    try {
      switch (strategy) {
        case 'immediate_retry':
          await this.executeImmediateRetry(attempt, context);
          break;
        case 'exponential_backoff':
          await this.executeExponentialBackoff(attempt, context);
          break;
        case 'qr_refresh':
          await this.executeQRRefresh(attempt, context);
          break;
        case 'pairing_code':
          await this.executePairingCode(attempt, context);
          break;
        case 'device_check':
          await this.executeDeviceCheck(attempt, context);
          break;
        case 'network_wait':
          await this.executeNetworkWait(attempt, context);
          break;
        default:
          await this.executeImmediateRetry(attempt, context);
      }
    } catch (error: any) {
      logger.error('Reconnection strategy execution failed', {
        attemptId: attempt.id,
        strategy,
        error: error.message,
      });

      // Record failed strategy
      await this.recordFailedStrategy(attempt, error);

      // Try fallback strategy
      await this.tryFallbackStrategy(attempt, context);
    }
  }

  /**
   * Execute immediate retry strategy
   */
  async executeImmediateRetry(attempt: any, context: any) {
    const delay = 1000; // 1 second

    for (let i = 0; i < attempt.maxRetries; i++) {
      attempt.retryCount = i + 1;

      logger.info('Executing immediate retry', {
        attemptId: attempt.id,
        retryCount: attempt.retryCount,
        delay,
      });

      // Wait for delay
      await this.delay(delay);

      // Attempt reconnection
      const success = await this.attemptReconnection(attempt, context);

      if (success) {
        await this.handleReconnectionSuccess(attempt);
        return;
      }
    }

    await this.handleReconnectionFailure(attempt, 'Max retries exceeded');
  }

  /**
   * Execute exponential backoff strategy
   */
  async executeExponentialBackoff(attempt: any, context: any) {
    for (let i = 0; i < attempt.maxRetries; i++) {
      attempt.retryCount = i + 1;

      // Calculate delay with exponential backoff and jitter
      const baseDelay = this.baseDelay * this.backoffMultiplier ** i;
      const jitter = baseDelay * this.jitterFactor * (Math.random() * 2 - 1);
      const delay = Math.min(baseDelay + jitter, this.maxDelay);

      logger.info('Executing exponential backoff', {
        attemptId: attempt.id,
        retryCount: attempt.retryCount,
        delay: Math.round(delay),
        baseDelay: Math.round(baseDelay),
      });

      // Wait for delay
      await this.delay(delay);

      // Attempt reconnection
      const success = await this.attemptReconnection(attempt, context);

      if (success) {
        await this.handleReconnectionSuccess(attempt);
        return;
      }
    }

    await this.handleReconnectionFailure(attempt, 'Max retries exceeded');
  }

  /**
   * Execute QR refresh strategy
   */
  async executeQRRefresh(attempt: any, context: any) {
    logger.info('Executing QR refresh strategy', { attemptId: attempt.id });

    if (this.qrRefreshHandler) {
      try {
        const success = await this.qrRefreshHandler(context);
        if (success) return await this.handleReconnectionSuccess(attempt);
      } catch (e: any) {
        logger.warn('QR refresh handler failed, falling back', { error: e.message });
      }
    }

    const success = await this.attemptReconnection(attempt, { ...context, qrRefresh: true });

    if (success) {
      await this.handleReconnectionSuccess(attempt);
    } else {
      await this.handleReconnectionFailure(attempt, 'QR refresh failed');
    }
  }

  /**
   * Execute pairing code strategy
   */
  async executePairingCode(attempt: any, context: any) {
    logger.info('Executing pairing code strategy', { attemptId: attempt.id });

    if (this.pairingCodeHandler) {
      try {
        const success = await this.pairingCodeHandler(context);
        if (success) return await this.handleReconnectionSuccess(attempt);
      } catch (e: any) {
        logger.warn('Pairing code handler failed, falling back', { error: e.message });
      }
    }

    const success = await this.attemptReconnection(attempt, { ...context, pairingCode: true });

    if (success) {
      await this.handleReconnectionSuccess(attempt);
    } else {
      await this.handleReconnectionFailure(attempt, 'Pairing code failed');
    }
  }

  /**
   * Execute device check strategy
   */
  async executeDeviceCheck(attempt: any, context: any) {
    logger.info('Executing device check strategy', { attemptId: attempt.id });

    // Wait for device to be available
    const deviceAvailable = await this.waitForDevice(attempt);

    if (deviceAvailable) {
      const success = await this.attemptReconnection(attempt, context);
      if (success) {
        await this.handleReconnectionSuccess(attempt);
        return;
      }
    }

    await this.handleReconnectionFailure(attempt, 'Device not available');
  }

  /**
   * Execute network wait strategy
   */
  async executeNetworkWait(attempt: any, context: any) {
    logger.info('Executing network wait strategy', { attemptId: attempt.id });

    // Wait for network to be stable
    const networkStable = await this.waitForNetwork(attempt);

    if (networkStable) {
      const success = await this.attemptReconnection(attempt, context);
      if (success) {
        await this.handleReconnectionSuccess(attempt);
        return;
      }
    }

    await this.handleReconnectionFailure(attempt, 'Network not stable');
  }

  /**
   * Attempt actual reconnection
   */
  async attemptReconnection(attempt: any, context: any) {
    try {
      if (this.reconnectHandler) {
        const ok = await this.reconnectHandler(context);
        logger.info('Reconnect handler executed', { attemptId: attempt.id, ok });
        return ok;
      }

      logger.warn('No reconnection handler configured', { attemptId: attempt.id });
      return false;
    } catch (error: any) {
      logger.error('Reconnection attempt failed', {
        attemptId: attempt.id,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Handle successful reconnection
   */
  async handleReconnectionSuccess(attempt: any) {
    const reconnectionTime = Date.now() - attempt.startTime;

    logger.info('Reconnection successful', {
      attemptId: attempt.id,
      reconnectionTime,
      retryCount: attempt.retryCount,
      strategy: attempt.strategy,
    });

    // Update connection state
    this.connectionState.isConnected = true;
    this.connectionState.lastConnected = Date.now();
    this.connectionState.retryCount = 0;

    // Update success rate
    this.updateSuccessRate(true);

    // Update average reconnection time
    this.updateAverageReconnectionTime(reconnectionTime);

    // Record successful strategy
    await this.recordSuccessfulStrategy(attempt);

    // Emit success event
    this.emit('reconnection_success', {
      attemptId: attempt.id,
      reconnectionTime,
      strategy: attempt.strategy,
      retryCount: attempt.retryCount,
    });

    // Clean up attempt
    this.activeAttempts.delete(attempt.id);
  }

  /**
   * Handle reconnection failure
   */
  async handleReconnectionFailure(attempt: any, reason: string) {
    logger.warn('Reconnection failed', {
      attemptId: attempt.id,
      reason,
      totalRetries: attempt.retryCount,
      strategy: attempt.strategy,
    });

    // Update success rate
    this.updateSuccessRate(false);

    // Record failed strategy
    await this.recordFailedStrategy(attempt, reason);

    // Emit failure event
    this.emit('reconnection_failure', {
      attemptId: attempt.id,
      reason,
      strategy: attempt.strategy,
      retryCount: attempt.retryCount,
    });

    // Clean up attempt
    this.activeAttempts.delete(attempt.id);
  }

  /**
   * Try fallback strategy
   */
  async tryFallbackStrategy(attempt: any, context: any) {
    const fallbackStrategies: Record<string, string> = {
      immediate_retry: 'exponential_backoff',
      exponential_backoff: 'qr_refresh',
      qr_refresh: 'pairing_code',
      pairing_code: 'device_check',
      device_check: 'network_wait',
      network_wait: 'manual_intervention',
    };

    const fallbackStrategy = fallbackStrategies[attempt.strategy];

    if (fallbackStrategy && fallbackStrategy !== 'manual_intervention') {
      logger.info('Trying fallback strategy', {
        attemptId: attempt.id,
        originalStrategy: attempt.strategy,
        fallbackStrategy,
      });

      attempt.strategy = fallbackStrategy;
      attempt.retryCount = 0;

      await this.executeReconnectionStrategy(attempt, context);
    } else {
      // No more fallback strategies
      await this.handleReconnectionFailure(attempt, 'No viable fallback strategy');
    }
  }

  /**
   * Record successful strategy for AI learning
   */
  async recordSuccessfulStrategy(attempt: any) {
    const record = {
      strategy: attempt.strategy,
      reasonType: attempt.analysis.type,
      reconnectionTime: Date.now() - attempt.startTime,
      retryCount: attempt.retryCount,
      timestamp: Date.now(),
      conditions: {
        networkQuality: 'unknown', // Would be determined
        deviceStatus: 'unknown',
        timeOfDay: this.getTimeOfDay(),
      },
    };

    this.learningData.successfulStrategies.push(record);

    // Keep only last 100 records
    if (this.learningData.successfulStrategies.length > 100) {
      this.learningData.successfulStrategies = this.learningData.successfulStrategies.slice(-100);
    }

    await this.saveLearningData();
  }

  /**
   * Record failed strategy for AI learning
   */
  async recordFailedStrategy(attempt: any, error: any) {
    const record = {
      strategy: attempt.strategy,
      reasonType: attempt.analysis.type,
      error: error?.message || error,
      retryCount: attempt.retryCount,
      timestamp: Date.now(),
    };

    this.learningData.failedStrategies.push(record);

    // Keep only last 50 records
    if (this.learningData.failedStrategies.length > 50) {
      this.learningData.failedStrategies = this.learningData.failedStrategies.slice(-50);
    }

    await this.saveLearningData();
  }

  /**
   * Update success rate
   */
  updateSuccessRate(success: boolean) {
    const totalAttempts = this.connectionState.totalRetries + 1;
    const successfulAttempts = success
      ? this.connectionState.successRate * this.connectionState.totalRetries + 1
      : this.connectionState.successRate * this.connectionState.totalRetries;

    this.connectionState.successRate = successfulAttempts / totalAttempts;
    this.connectionState.totalRetries = totalAttempts;
  }

  /**
   * Update average reconnection time
   */
  updateAverageReconnectionTime(time: number) {
    const totalTimes =
      this.connectionState.averageReconnectionTime * (this.connectionState.totalRetries - 1) + time;
    this.connectionState.averageReconnectionTime = totalTimes / this.connectionState.totalRetries;
  }

  /**
   * Get time of day
   */
  getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  }

  /**
   * Assess network quality
   */
  assessNetworkQuality(context: any) {
    // This would be determined by actual network monitoring
    return context.networkQuality || 'unknown';
  }

  /**
   * Assess device status
   */
  assessDeviceStatus(context: any) {
    // This would be determined by device monitoring
    return context.deviceStatus || 'unknown';
  }

  /**
   * Wait for device to be available
   */
  async waitForDevice(attempt: any) {
    // Simulate waiting for device
    const maxWait = 5 * 60 * 1000; // 5 minutes
    const checkInterval = 10000; // 10 seconds

    if (this.deviceCheckHandler) {
      try { return await this.deviceCheckHandler(); } catch (_) { }
    }
    for (let waited = 0; waited < maxWait; waited += checkInterval) {
      await this.delay(checkInterval);
      const deviceAvailable = Math.random() > 0.7;
      if (deviceAvailable) return true;
    }
    return false;
  }

  /**
   * Wait for network to be stable
   */
  async waitForNetwork(attempt: any) {
    // Simulate waiting for network
    const maxWait = 2 * 60 * 1000; // 2 minutes
    const checkInterval = 5000; // 5 seconds

    if (this.networkCheckHandler) {
      try { return await this.networkCheckHandler(); } catch (_) { }
    }
    for (let waited = 0; waited < maxWait; waited += checkInterval) {
      await this.delay(checkInterval);
      const networkStable = Math.random() > 0.5;
      if (networkStable) return true;
    }
    return false;
  }

  /**
   * Utility delay function
   */
  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get reconnection statistics
   */
  getStats() {
    return {
      connectionState: this.connectionState,
      activeAttempts: this.activeAttempts.size,
      learningData: {
        successfulStrategies: this.learningData.successfulStrategies.length,
        failedStrategies: this.learningData.failedStrategies.length,
      },
    };
  }
}

export default AutoReconnectionEngine;

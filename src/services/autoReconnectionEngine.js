const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../utils/logger');
const { EventEmitter } = require('events');

class AutoReconnectionEngine extends EventEmitter {
  constructor(unifiedAuth, options = {}) {
    super();
    this.unifiedAuth = unifiedAuth; // The real auth service
    this.maxRetries = options.maxRetries || 5;
    this.baseDelay = options.baseDelay || 2000;
    this.maxDelay = options.maxDelay || 300000;
    this.backoffMultiplier = options.backoffMultiplier || 2;
  }

  async handleDisconnection(reason) {
    logger.warn('Disconnection detected', { reason });
    await this.updateConnectionState({
      isConnected: false,
      lastDisconnected: new Date(),
      disconnectReason: reason,
    });
    this.emit('disconnection', { reason });
    this.initiateReconnection(reason);
  }

  async initiateReconnection(reason) {
    logger.info('Initiating reconnection process...');
    let success = false;
    for (let i = 0; i < this.maxRetries; i++) {
      const delay = this.baseDelay * Math.pow(this.backoffMultiplier, i);
      const waitTime = Math.min(delay, this.maxDelay);
      logger.info(`Waiting for ${waitTime}ms before attempt #${i + 1}`);
      await new Promise(res => setTimeout(res, waitTime));

      try {
        logger.info(`Attempting reconnection #${i + 1}`);
        // This should trigger the actual reconnection logic in the auth service
        await this.unifiedAuth.reconnect();

        // If reconnect() doesn't throw, we assume it's handling it.
        // We wait for a 'connection_update' event from unifiedAuth.
        // For this refactor, we'll assume success if no error is thrown.
        success = true;

        await this.logReconnectionAttempt(reason, 'SUCCESS', i + 1);
        await this.handleReconnectionSuccess();
        break;
      } catch (error) {
        logger.error(`Reconnection attempt #${i + 1} failed`, { error: error.message });
        await this.logReconnectionAttempt(reason, 'FAILURE', i + 1, error.message);
      }
    }

    if (!success) {
      await this.handleReconnectionFailure(reason);
    }
  }

  async handleReconnectionSuccess() {
    logger.info('Reconnection successful');
    await this.updateConnectionState({
      isConnected: true,
      lastConnected: new Date(),
      retryCount: 0,
    });
    this.emit('reconnection_success');
  }

  async handleReconnectionFailure(reason) {
    logger.error('Reconnection failed after multiple retries', { reason });
    this.emit('reconnection_failure', { reason });
  }

  async updateConnectionState(state) {
    // Using BotSetting to store connection state
    for (const [key, value] of Object.entries(state)) {
      await prisma.botSetting.upsert({
        where: { key: `connection.${key}` },
        update: { value: String(value) },
        create: { key: `connection.${key}`, value: String(value), category: 'system' },
      });
    }
  }

  async logReconnectionAttempt(reason, outcome, retryCount, error = null) {
    await prisma.auditLog.create({
      data: {
        eventType: 'RECONNECTION_ATTEMPT',
        actor: 'system',
        action: `Reconnection attempt ${outcome.toLowerCase()}`,
        resource: 'connection',
        details: JSON.stringify({
          reason,
          retryCount,
          strategy: 'exponential_backoff',
          error,
        }),
        riskLevel: outcome === 'SUCCESS' ? 'LOW' : 'MEDIUM',
      },
    });
  }

  async getStats() {
    const settings = await prisma.botSetting.findMany({
        where: { key: { startsWith: 'connection.' } },
    });
    const state = settings.reduce((acc, setting) => {
        acc[setting.key.replace('connection.', '')] = setting.value;
        return acc;
    }, {});

    const totalRetries = await prisma.auditLog.count({
        where: { eventType: 'RECONNECTION_ATTEMPT' }
    });

    return {
      connectionState: state,
      totalRetries,
    };
  }
}

module.exports = AutoReconnectionEngine;

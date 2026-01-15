import { EventEmitter } from 'events';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import { makeWASocket, DisconnectReason, type WASocket } from 'baileys';
import logger from '../utils/logger.js';
import { useFirestoreAuthState } from '../lib/baileysFirestoreAuth.js';
import { Result } from '../types/index.js';
import { AppError } from './errorHandler.js';

interface AuthConfig {
  bot: {
    phoneNumber?: string;
    sessionId?: string;
  };
}

interface AuthStats {
  totalAttempts: number;
  successes: number;
  methodStats: {
    qr: { attempts: number; successes: number };
    pairing: { attempts: number; successes: number };
  };
  activeSessions: number;
}

class AuthSystem extends EventEmitter {
  private readonly config: AuthConfig;
  private readonly tenantId: string;
  private readonly botId: string;
  private authState: 'connected' | 'disconnected' | 'connecting';
  private client: WASocket | null;
  private currentQrCode: string | null;
  private stats: AuthStats;

  constructor(config: AuthConfig, tenantId: string, botId: string) {
    super();
    this.config = config;
    this.tenantId = tenantId;
    this.botId = botId;
    this.authState = 'disconnected';
    this.client = null;
    this.currentQrCode = null;

    this.stats = {
      totalAttempts: 0,
      successes: 0,
      methodStats: {
        qr: { attempts: 0, successes: 0 },
        pairing: { attempts: 0, successes: 0 },
      },
      activeSessions: 0,
    };

    logger.info(`AuthSystem initialized for Bot: ${botId} (Tenant: ${tenantId})`);
  }

  async connect(): Promise<Result<WASocket>> {
    this.authState = 'connecting';
    const method = this.config.bot.phoneNumber ? 'pairing' : 'qr';
    this._recordAttempt(method);

    try {
      // Fix: Correctly pass tenantId and botId to the auth adapter
      const { state, saveCreds } = await useFirestoreAuthState(this.tenantId, this.botId);

      const pinoLogger = pino({ level: 'silent' });

      this.client = makeWASocket({
        auth: state,
        printQRInTerminal: true, // We might want to disable this in production/SaaS mode
        logger: pinoLogger as any,
        browser: ['WhatsDeX', 'Chrome', '1.0.0'],
      });

      this.client.ev.on('creds.update', saveCreds);

      this.client.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.currentQrCode = qr;
          this.emit('qr', qr);
          this.stats.methodStats.qr.attempts++;
        }

        if (connection === 'close') {
          this.authState = 'disconnected';
          this.stats.activeSessions = 0;

          const error = lastDisconnect?.error;
          const statusCode = (error as Boom)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

          logger.warn(`Connection closed. Reconnect: ${shouldReconnect}`, { error, statusCode });
          this.emit('disconnected', error);

          if (shouldReconnect) {
            this.connect(); // Auto-reconnect
          }
        } else if (connection === 'open') {
          this.authState = 'connected';
          this.stats.activeSessions = 1;
          this.stats.successes++;
          this.emit('connected');
        }
      });

      return { success: true, data: this.client };

    } catch (error: unknown) {
      this.authState = 'disconnected';
      const appError = error instanceof Error ? error : new Error('Unknown connection error');
      logger.error('AuthSystem connection failed', { error: appError });
      return { success: false, error: appError };
    }
  }

  async disconnect(): Promise<Result<void>> {
    if (this.client) {
      try {
        this.client.end(undefined); // Correct way to close baileys socket
        this.client = null;
        this.authState = 'disconnected';
        this.stats.activeSessions = 0;
        return { success: true, data: undefined };
      } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error : new Error('Disconnect failed') };
      }
    }
    return { success: true, data: undefined };
  }

  async getPairingCode(phoneNumber: string): Promise<Result<string>> {
    if (!this.client) {
      return { success: false, error: new AppError('Baileys client not initialized. Call connect() first.') };
    }
    if (!phoneNumber) {
      return { success: false, error: new AppError('Phone number is required for pairing code.') };
    }

    try {
      const formattedPhoneNumber = phoneNumber.replace(/\D/g, '');
      this._recordAttempt('pairing');

      const code = await this.client.requestPairingCode(formattedPhoneNumber);
      logger.info(`Requested Pairing Code: ${code}`);

      return { success: true, data: code };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error : new Error('Failed to get pairing code') };
    }
  }

  async getQRCode(): Promise<Result<string | null>> {
    if (!this.client) {
      return { success: false, error: new AppError('Baileys client not initialized.') };
    }
    return { success: true, data: this.currentQrCode };
  }

  async detectExistingSession(): Promise<{ hasSession: boolean; isValid: boolean }> {
    try {
      const { state } = await useFirestoreAuthState(this.tenantId, this.botId);
      // Check if we have a registration ID and 'me' object which indicates a successful login
      const hasSession = !!(state.creds && state.creds.registrationId);
      const isValid = !!(state.creds && state.creds.me);
      return { hasSession, isValid };
    } catch (error) {
      logger.error('Error detecting existing session', { error });
      return { hasSession: false, isValid: false };
    }
  }

  getAnalytics() {
    const successRate = this.stats.totalAttempts > 0
      ? `${Math.round((this.stats.successes / this.stats.totalAttempts) * 100)}%`
      : '0%';

    return {
      activeSessions: this.stats.activeSessions,
      stats: {
        ...this.stats,
        successRate
      }
    };
  }

  async getSmartAuthMethod(config: any): Promise<{ method: 'qr' | 'pairing'; confidence: number }> {
    // Logic to determine best auth method
    if (config?.bot?.phoneNumber || this.config.bot.phoneNumber) {
      return { method: 'pairing', confidence: 1.0 };
    }
    return { method: 'qr', confidence: 0.9 };
  }

  get authStrategies() {
    return {
      qr: async (config: any) => {
        return await this.connect();
      },
      pairing: async (config: any) => {
        const conn = await this.connect();
        if (conn.success && conn.data) {
          const phoneNumber = config?.bot?.phoneNumber || this.config.bot.phoneNumber;
          if (phoneNumber) {
            const code = await this.getPairingCode(phoneNumber);
            return { ...conn, pairingCode: code.success ? code.data : null };
          }
        }
        return conn;
      }
    };
  }

  private _recordAttempt(method: 'qr' | 'pairing') {
    this.stats.totalAttempts++;
    if (this.stats.methodStats[method]) {
      this.stats.methodStats[method].attempts++;
    }
  }
}

export default AuthSystem;

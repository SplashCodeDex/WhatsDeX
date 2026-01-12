import { EventEmitter } from 'events';
import pino from 'pino';
import path from 'node:path';
import { Boom } from '@hapi/boom';
import logger from '../utils/logger';
import { fileURLToPath } from 'url';
// ESM-compatible import for baileys (CJS under the hood)
import baileys from '@whiskeysockets/baileys';
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = baileys;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AuthSystem extends EventEmitter {
  config: any;
  authState: string;
  client: any;
  currentQrCode: string | null;
  stats: any;

  constructor(config: any) {
    super();
    this.config = config || {};
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

    logger.info('AuthSystem initialized');
  }

  async connect() {
    this._recordAttempt(this.config.bot?.phoneNumber ? 'pairing' : 'qr');

    // Default to 'auth_info_baileys' if config missing, to prevent crash
    const authPathRel = this.config.bot?.authAdapter?.default?.authDir || 'auth_info_baileys';
    const authDir = path.isAbsolute(authPathRel)
      ? authPathRel
      : path.resolve(process.cwd(), authPathRel); // Use process.cwd() for reliability

    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    const pinoLogger = pino({ level: 'silent' });

    this.client = makeWASocket({
      auth: state,
      printQRInTerminal: true,
      logger: pinoLogger,
      browser: ['WhatsDeX', 'Chrome', '1.0.0'],
    });

    this.client.ev.on('creds.update', saveCreds);

    this.client.ev.on('connection.update', (update: any) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        this.currentQrCode = qr;
        this.emit('qr', qr);
        if (this.stats.methodStats.qr) this.stats.methodStats.qr.attempts++;
      }

      if (connection === 'close') {
        this.authState = 'disconnected';
        this.stats.activeSessions = 0;
        const shouldReconnect =
          lastDisconnect?.error instanceof Boom
            ? (lastDisconnect.error as any).output.statusCode !== DisconnectReason.loggedOut
            : true;

        this.emit('disconnected', lastDisconnect?.error);

        if (shouldReconnect) {
          this.connect();
        }
      } else if (connection === 'open') {
        this.authState = 'connected';
        this.stats.activeSessions = 1;
        this.stats.successes++;
        this.emit('connected');
      }
    });

    return this.client;
  }

  async disconnect() {
    if (this.client) {
      await this.client.logout();
      this.client = null;
      this.authState = 'disconnected';
      this.stats.activeSessions = 0;
    }
  }

  async getPairingCode(phoneNumber: string) {
    if (!this.client) {
      throw new Error('Baileys client not initialized. Call connect() first.');
    }
    if (!phoneNumber) {
      throw new Error('Phone number is required to request a pairing code.');
    }
    const formattedPhoneNumber = phoneNumber.replace(/\D/g, '');
    this._recordAttempt('pairing');
    const code = await this.client.requestPairingCode(formattedPhoneNumber);
    // Redact pairing code from logs
    logger.info(`Requested Pairing Code`);
    return code;
  }

  async getQRCode() {
    if (!this.client) {
      throw new Error('Baileys client not initialized. Call connect() first.');
    }
    return this.currentQrCode || null;
  }

  // Check for an existing, valid session
  async detectExistingSession() {
    // This is a simplified check. A real implementation would verify session validity.
    const hasSession = this.authState === 'connected' && !!this.client;
    return {
      hasSession,
      isValid: hasSession,
    };
  }

  // Compatibility / Orchestrator methods
  async getSmartAuthMethod(config: any = {}) {
    // Simple logic: if phone number provided, prefer pairing
    const method = config?.bot?.phoneNumber ? 'pairing' : 'qr';
    return { method, confidence: 0.9 };
  }

  // Define authentication strategies
  authStrategies = {
    qr: async () => this.getQRCode(),
    pairing: async (config: any) => this.getPairingCode(config.bot.phoneNumber),
  };

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

  _recordAttempt(method: string) {
    this.stats.totalAttempts++;
    if (this.stats.methodStats[method]) {
      this.stats.methodStats[method].attempts++;
    }
  }
}

export default AuthSystem;

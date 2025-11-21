import { EventEmitter } from 'events';
import pino from 'pino';
import path from 'node:path';
import { Boom } from '@hapi/boom';
import logger from '../../utils/logger.js';
import { fileURLToPath } from 'url';

// ESM-compatible import for baileys (CJS under the hood)
import baileys from '@whiskeysockets/baileys';
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = baileys;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class UnifiedSmartAuth extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.authState = 'disconnected';
    this.client = null;
    this.currentQrCode = null; // Initialize currentQrCode

    logger.info('UnifiedSmartAuth initialized');
  }

  async connect() {
    const authDir = path.resolve(__dirname, this.config.bot.authAdapter.default.authDir);
    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    const pinoLogger = pino({ level: 'silent' });

    this.client = makeWASocket({
      auth: state,
      printQRInTerminal: true,
      logger: pinoLogger,
      browser: ['WhatsDeX', 'Chrome', '1.0.0'],
    });

    this.client.ev.on('creds.update', saveCreds);

    this.client.ev.on('connection.update', update => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        this.currentQrCode = qr; // Store the QR code
        this.emit('qr', qr);
      }

      if (connection === 'close') {
        this.authState = 'disconnected';
        const shouldReconnect =
          lastDisconnect?.error instanceof Boom
            ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
            : true;

        this.emit('disconnected', lastDisconnect?.error);

        if (shouldReconnect) {
          this.connect();
        }
      } else if (connection === 'open') {
        this.authState = 'connected';
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
    }
  }

  async getPairingCode(phoneNumber) {
    if (!this.client) {
      throw new Error('Baileys client not initialized. Call connect() first.');
    }
    if (!phoneNumber) {
      throw new Error('Phone number is required to request a pairing code.');
    }
    // Ensure phone number is in E.164 format without '+'
    const formattedPhoneNumber = phoneNumber.replace(/\D/g, '');
    const code = await this.client.requestPairingCode(formattedPhoneNumber);
    logger.info(`Requested Pairing Code: ${code}`);
    return code;
  }

  async getQRCode() {
    if (!this.client) {
      throw new Error('Baileys client not initialized. Call connect() first.');
    }
    // Return the last received QR code, or null if not available
    return this.currentQrCode || null;
  }
}

export default UnifiedSmartAuth;

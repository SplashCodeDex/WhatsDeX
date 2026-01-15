import { EventEmitter } from 'node:events';
import AuthSystem from './authSystem.js';
import { GlobalContext, Bot } from '../types/index.js';

class AuthenticationService extends EventEmitter {
  private unifiedAuth: AuthSystem;
  private config: any;
  private bot: Bot;

  constructor(context: GlobalContext, client: Bot) {
    super();
    const tenantId = context.config.bot.tenantId || 'system';
    const botId = context.config.bot.sessionId || 'default';
    this.unifiedAuth = new AuthSystem(context.config as any, tenantId, botId);
    this.config = context.config;
    this.bot = client;

    this.unifiedAuth.on('qr', (qr: string) => this.emit('qr', qr));
    this.unifiedAuth.on('code', (code: string) => this.emit('code', code));
    this.unifiedAuth.on('authenticated', () => this.emit('authentication-success', this.bot));
    this.unifiedAuth.on('disconnected', (reason: any) => this.emit('authentication-failure', reason));
  }

  async start() {
    const session = await this.unifiedAuth.detectExistingSession();
    if (session.hasSession && session.isValid) {
      if ((this.bot as any).launch) await (this.bot as any).launch();
    } else {
      this.emit('no-session-found');
    }
  }

  async continueSession() {
    if (this.bot) {
      this.emit('authentication-success', this.bot);
    } else {
      this.emit('authentication-failure', new Error('Bot not initialized for continuing session.'));
    }
  }

  async reauthenticate() {
    this.emit('authentication-choice-required');
  }

  async authenticate(method: string) {
    try {
      if (!this.config.bot.phoneNumber) {
        throw new Error('Phone number not provided in the configuration.');
      }
      if ((this.bot as any).launch) await (this.bot as any).launch();
    } catch (error: any) {
      this.emit('authentication-failure', error);
    }
  }

  getAnalytics() {
    // This will be implemented later
    return {};
  }
}

export default AuthenticationService;

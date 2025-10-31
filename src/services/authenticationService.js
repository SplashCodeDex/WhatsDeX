const { EventEmitter } = require('events');
const UnifiedSmartAuth = require('./unifiedSmartAuth');

class AuthenticationService extends EventEmitter {
  constructor(context, client) {
    super();
    this.unifiedAuth = new UnifiedSmartAuth(context.config, client);
    this.config = context.config;
    this.bot = client;

    this.unifiedAuth.on('qr', qr => this.emit('qr', qr));
    this.unifiedAuth.on('code', code => this.emit('code', code));
    this.unifiedAuth.on('authenticated', () => this.emit('authentication-success', this.bot));
    this.unifiedAuth.on('disconnected', reason => this.emit('authentication-failure', reason));
  }

  async start() {
    const session = await this.unifiedAuth.detectExistingSession();
    if (session.hasSession && session.isValid) {
      await this.bot.launch();
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

  async authenticate(method) {
    try {
      if (!this.config.bot.phoneNumber) {
        throw new Error('Phone number not provided in the configuration.');
      }
      await this.bot.launch();
    } catch (error) {
      this.emit('authentication-failure', error);
    }
  }

  getAnalytics() {
    // This will be implemented later
    return {};
  }
}

module.exports = AuthenticationService;

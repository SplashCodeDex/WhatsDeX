import { EventEmitter } from 'node:events';

/**
 * UnifiedSmartAuth
 * A minimal, general-purpose authentication orchestrator used by interactiveAuth
 * and AuthenticationService. Provides stubbed strategies and analytics with
 * sensible defaults so the codebase can lint/build without runtime coupling.
 */
class UnifiedSmartAuth extends EventEmitter {
  constructor(config = {}, client = null) {
    super();
    this.config = config || {};
    this.client = client;
    this.stats = {
      totalAttempts: 0,
      successes: 0,
      methodStats: {
        qr: { attempts: 0, successes: 0 },
        pairing: { attempts: 0, successes: 0 },
      },
      activeSessions: 0,
      learningDataPoints: 0,
    };

    // Strategy map expected by InteractiveAuthEnhancement
    this.authStrategies = {
      qr: async cfg => this.handleQRStrategy(cfg),
      pairing: async cfg => this.handlePairingStrategy(cfg),
    };
  }

  // Detect if a session exists by checking for state/creds.json (simple heuristic)
  async detectExistingSession() {
    try {
      const fs = await import('node:fs');
      const path = await import('node:path');
      const statePath = path.join(process.cwd(), 'state');
      const credsPath = path.join(statePath, 'creds.json');
      const hasState = fs.existsSync(statePath);
      const hasCreds = fs.existsSync(credsPath);

      if (hasState && hasCreds) {
        this.stats.activeSessions = 1;
        return { hasSession: true, isValid: true, sessionInfo: { lastActive: new Date().toISOString() } };
      }
      return { hasSession: false, isValid: false };
    } catch {
      return { hasSession: false, isValid: false };
    }
  }

  // Pick best method (simple heuristic: prefer pairing if phoneNumber present)
  async getSmartAuthMethod(config = {}) {
    const method = config?.bot?.phoneNumber ? 'pairing' : 'qr';
    return { method, confidence: 0.7 };
  }

  async handleQRStrategy(config = {}) {
    this._recordAttempt('qr');
    // Emit a placeholder QR event string
    const qr = 'QR-DUMMY-CODE';
    setImmediate(() => this.emit('qr', qr));
    this._recordSuccess('qr');
    return { method: 'qr', phoneRequired: false, phoneNumber: config?.bot?.phoneNumber || null };
  }

  async handlePairingStrategy(config = {}) {
    this._recordAttempt('pairing');
    // Emit a placeholder code event
    const code = '123-456';
    setImmediate(() => this.emit('code', code));
    this._recordSuccess('pairing');
    return { method: 'pairing', phoneRequired: true, phoneNumber: config?.bot?.phoneNumber || null };
  }

  async recordUserChoice(entry) {
    // Keep a light-weight counter for analytics purposes
    this.stats.learningDataPoints += 1;
    return { ok: true, entry };
  }

  getAnalytics() {
    const successRate = this.stats.totalAttempts > 0
      ? `${Math.round((this.stats.successes / this.stats.totalAttempts) * 100)}%`
      : '0%';
    return {
      totalAttempts: this.stats.totalAttempts,
      successRate,
      activeSessions: this.stats.activeSessions,
      learningDataPoints: this.stats.learningDataPoints,
      methodStats: this.stats.methodStats,
    };
  }

  // Internal helpers
  _recordAttempt(method) {
    this.stats.totalAttempts += 1;
    if (this.stats.methodStats[method]) this.stats.methodStats[method].attempts += 1;
  }
  _recordSuccess(method) {
    this.stats.successes += 1;
    if (this.stats.methodStats[method]) this.stats.methodStats[method].successes += 1;
    setImmediate(() => this.emit('authenticated'));
  }
}

export default UnifiedSmartAuth;

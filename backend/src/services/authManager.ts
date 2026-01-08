/**
 * AuthManager
 * Provides detectAuthStatus and executeSmartAuth on top of AuthSystem.
 */
import AuthSystem from './authSystem';

class AuthManager {
  unified: AuthSystem;

  constructor() {
    this.unified = new AuthSystem({});
  }

  async detectAuthStatus(config = {}) {
    const session = await this.unified.detectExistingSession();
    const methodChoice = await this.unified.getSmartAuthMethod(config);
    const recommendation = {
      message: session.hasSession && session.isValid
        ? 'Continue existing session'
        : methodChoice.method === 'qr' ? 'Use QR authentication' : 'Use Pairing Code',
    };
    return {
      isAuthenticated: !!(session.hasSession && session.isValid),
      method: session.hasSession ? 'session' : methodChoice.method,
      confidence: Math.round((methodChoice.confidence || 0.7) * 100),
      phoneNumber: config?.bot?.phoneNumber || null,
      recommendation,
    };
  }

  async executeSmartAuth(config = {}) {
    const session = await this.unified.detectExistingSession();
    if (session.hasSession && session.isValid) {
      return { result: { method: 'session', phoneRequired: false, phoneNumber: config?.bot?.phoneNumber || null } };
    }
    const methodChoice = await this.unified.getSmartAuthMethod(config);
    const result = await this.unified.authStrategies[methodChoice.method](config);
    return { result };
  }
}

export default AuthManager;

/**
 * AuthManager
 * Provides detectAuthStatus and executeSmartAuth on top of AuthSystem.
 */
import AuthSystem from './authSystem.js';

class AuthManager {
  unified: AuthSystem;

  constructor() {
    this.unified = new AuthSystem({ bot: {} } as any, 'system', 'manager_bot');
  }

  async detectAuthStatus(config: any = {}) {
    const session = await this.unified.detectExistingSession();
    const methodChoice = await this.unified.getSmartAuthMethod(config);
    const recommendation = {
      message: session.hasSession && session.isValid
        ? 'Continue existing session'
        : methodChoice.method === 'qr' ? 'Use QR authentication' : 'Use Pairing Code',
    };
    return {
      isAuthenticated: !!(session.hasSession && session.isValid),
      method: (session.hasSession && session.isValid) ? 'session' : methodChoice.method,
      confidence: Math.round((methodChoice.confidence || 0.7) * 100),
      phoneNumber: config?.bot?.phoneNumber || null,
      recommendation,
    };
  }

  async executeSmartAuth(config: any = {}) {
    const session = await this.unified.detectExistingSession();
    if (session.hasSession && session.isValid) {
      return { result: { method: 'session', phoneRequired: false, phoneNumber: config?.bot?.phoneNumber || null } };
    }
    const methodChoice = await this.unified.getSmartAuthMethod(config);
    const result = await (this.unified as any).authStrategies[methodChoice.method](config);
    return { result };
  }
}

export default AuthManager;

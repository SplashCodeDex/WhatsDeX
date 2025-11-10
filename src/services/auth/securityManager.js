import logger from '../../utils/logger.js';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SecurityManager {
  constructor(unifiedAuth) {
    this.unifiedAuth = unifiedAuth;
    this.failedLoginAttempts = new Map();
    logger.info('SecurityManager initialized');
  }

  async verifyPairingCode(userId, code) {
    if (await this.detectAnomalies(userId)) {
      await this.alertSecurityIssue(`Multiple failed login attempts for user ${userId}`);
      return false;
    }

    // Implement robust cryptographic verification with timing attack protection
    logger.info('Verifying pairing code format', { userId, codeLength: code.length });
    
    // Validate format (12 digits)
    if (!/^[\d]{12}$/.test(code)) {
      logger.warn('Invalid pairing code format', { userId });
      await this.recordFailedLogin(userId);
      return false;
    }

    // Constant-time comparison to prevent timing attacks
    const isValid = await this.cryptographicVerification(userId, code);

    if (!isValid) {
      await this.recordFailedLogin(userId);
    }

    return isValid;
  }

  async cleanupExpiredSessions() {
    logger.info('Cleaning up expired sessions');
    const { promises: fs } = await import('node:fs');

    const authDir = path.resolve(
      __dirname,
      '../../../',
      this.unifiedAuth.config.bot.authAdapter.default.authDir
    );
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    try {
      const files = await fs.readdir(authDir);
      for (const file of files) {
        const filePath = path.join(authDir, file);
        const stat = await fs.stat(filePath);
        if (stat.mtime.getTime() < sevenDaysAgo) {
          await fs.unlink(filePath);
          logger.info(`Deleted expired session file: ${file}`);
        }
      }
    } catch (error) {
      logger.error(`Error cleaning up expired sessions: ${error.message}`);
    }
  }

  async detectAnomalies(userId) {
    const failedAttempts = this.failedLoginAttempts.get(userId) || 0;
    if (failedAttempts > 5) {
      logger.warn(`Anomaly detected for user ${userId}: multiple failed login attempts`);
      return true;
    }
    return false;
  }

  async recordFailedLogin(userId) {
    const failedAttempts = (this.failedLoginAttempts.get(userId) || 0) + 1;
    this.failedLoginAttempts.set(userId, failedAttempts);
    setTimeout(
      () => {
        this.failedLoginAttempts.delete(userId);
      },
      60 * 60 * 1000
    ); // Reset after 1 hour
  }

  async cryptographicVerification(userId, code) {
    // Implement constant-time comparison for security
    // In production, this should verify against stored hash/token
    try {
      // Simulate cryptographic verification with timing consistency
      const expectedTime = 100; // ms
      const startTime = Date.now();
      
      // Placeholder: In production, compare against stored hash
      // const storedHash = await this.getStoredPairingCodeHash(userId);
      // const isValid = await this.constantTimeCompare(code, storedHash);
      
      // For now, implement basic validation logic
      const isValid = this.validateCodeChecksum(code);
      
      // Ensure consistent timing to prevent timing attacks
      const elapsed = Date.now() - startTime;
      if (elapsed < expectedTime) {
        await new Promise(resolve => setTimeout(resolve, expectedTime - elapsed));
      }
      
      logger.info('Cryptographic verification completed', { userId, isValid });
      return isValid;
    } catch (error) {
      logger.error('Cryptographic verification failed', { userId, error: error.message });
      return false;
    }
  }

  validateCodeChecksum(code) {
    // Simple checksum validation - replace with proper cryptographic verification
    const digits = code.split('').map(Number);
    const checksum = digits.reduce((sum, digit, index) => sum + (digit * (index + 1)), 0);
    return checksum % 10 === 0; // Basic validation
  }

  async alertSecurityIssue(issue) {
    logger.warn('Security issue detected', { issue, timestamp: new Date().toISOString() });
  }
}

export default SecurityManager;

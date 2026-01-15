/**
 * Menfes/Confess Service - Anonymous messaging system
 */

import crypto from 'crypto';
import { Result } from '../types/index.js';
import logger from '../utils/logger.js';

interface MenfesSession {
  id: string;
  fromUser: string;
  toUser: string;
  fakeName: string;
  startTime: number;
  messageCount: number;
  isActive: boolean;
}

interface MenfesMessage {
  from: string;
  to: string;
  message: any;
  timestamp: number;
}

interface RateLimitInfo {
  lastUsed: number;
  count: number;
}

export class MenfesService {
  private static instance: MenfesService;
  private activeSessions: Map<string, MenfesSession>;
  private sessionTimeouts: Map<string, NodeJS.Timeout>;
  private rateLimits: Map<string, RateLimitInfo>;
  private messageHistory: Map<string, MenfesMessage[]>;

  private constructor() {
    this.activeSessions = new Map();
    this.sessionTimeouts = new Map();
    this.rateLimits = new Map();
    this.messageHistory = new Map();
  }

  public static getInstance(): MenfesService {
    if (!MenfesService.instance) {
      MenfesService.instance = new MenfesService();
    }
    return MenfesService.instance;
  }

  /**
   * Start menfes session
   */
  async startMenfesSession(fromUser: string, toUser: string, fakeName: string): Promise<Result<{ sessionId: string; message: string }>> {
    try {
      const cleanNumber = toUser.replace(/\D/g, '');
      if (cleanNumber.length < 10 || cleanNumber.length > 15) {
        return { success: false, error: new Error('Invalid phone number format') };
      }

      const targetJid = `${cleanNumber}@s.whatsapp.net`;

      if (this.activeSessions.has(fromUser)) {
        return { success: false, error: new Error('Kamu Sedang Berada Di Sesi menfes!') };
      }

      if (this.activeSessions.has(targetJid)) {
        return { success: false, error: new Error('Target user sudah dalam sesi menfes dengan orang lain') };
      }

      if (!this.checkRateLimit(fromUser, 'start_session')) {
        return { success: false, error: new Error('Rate limit exceeded. Please wait.') };
      }

      const sessionId = crypto.randomUUID();

      const sessionData: MenfesSession = {
        id: sessionId,
        fromUser,
        toUser: targetJid,
        fakeName: fakeName || 'Seseorang',
        startTime: Date.now(),
        messageCount: 0,
        isActive: true,
      };

      this.activeSessions.set(fromUser, sessionData);
      this.activeSessions.set(targetJid, {
        ...sessionData,
        fromUser: targetJid,
        toUser: fromUser,
        fakeName: 'Penerima',
      });

      const timeout = setTimeout(() => {
        this.endMenfesSession(fromUser, 'timeout');
      }, 600000);

      this.sessionTimeouts.set(fromUser, timeout);
      this.sessionTimeouts.set(targetJid, timeout);
      this.messageHistory.set(sessionId, []);

      return {
        success: true,
        data: {
          sessionId,
          message: `_Memulai menfes..._\n*Silahkan Mulai kirim pesan/media*\n*Durasi menfes hanya selama 10 menit*`,
        }
      };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Error starting menfes session:', err);
      return { success: false, error: err };
    }
  }

  /**
   * Send menfes message
   */
  async sendMenfesMessage(fromUser: string, message: any): Promise<Result<{ forwarded: boolean }>> {
    try {
      const session = this.activeSessions.get(fromUser);
      if (!session || !session.isActive) {
        return { success: false, error: new Error('No active menfes session found') };
      }

      if (Date.now() - session.startTime > 600000) {
        await this.endMenfesSession(fromUser, 'expired');
        return { success: false, error: new Error('Session expired') };
      }

      if (!this.checkRateLimit(fromUser, 'send_message')) {
        return { success: false, error: new Error('Rate limit exceeded') };
      }

      const history = this.messageHistory.get(session.id) || [];
      history.push({
        from: fromUser,
        to: session.toUser,
        message,
        timestamp: Date.now(),
      });
      this.messageHistory.set(session.id, history);

      session.messageCount++;
      return { success: true, data: { forwarded: true } };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Error sending menfes message:', err);
      return { success: false, error: err };
    }
  }

  /**
   * End menfes session
   */
  async endMenfesSession(userId: string, reason = 'manual'): Promise<Result<{ messageCount: number }>> {
    try {
      const session = this.activeSessions.get(userId);
      if (!session) {
        return { success: false, error: new Error('No active session found') };
      }

      this.clearSessionTimeouts(userId, session.toUser);

      this.activeSessions.delete(userId);
      this.activeSessions.delete(session.toUser);

      // Keep history for 24 hours then delete
      setTimeout(() => this.messageHistory.delete(session.id), 86400000);

      return {
        success: true,
        data: { messageCount: session.messageCount }
      };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      return { success: false, error: err };
    }
  }

  private clearSessionTimeouts(u1: string, u2: string): void {
    [u1, u2].forEach(u => {
      const t = this.sessionTimeouts.get(u);
      if (t) {
        clearTimeout(t);
        this.sessionTimeouts.delete(u);
      }
    });
  }

  public getActiveSession(userId: string): MenfesSession | undefined {
    return this.activeSessions.get(userId);
  }

  public checkRateLimit(userId: string, operation: string): boolean {
    const key = `${userId}_${operation}`;
    const now = Date.now();
    const limit = this.rateLimits.get(key);

    const configs: Record<string, { cooldown: number; max: number }> = {
      start_session: { cooldown: 300000, max: 1 },
      send_message: { cooldown: 10000, max: 5 },
    };

    const config = configs[operation] || { cooldown: 60000, max: 1 };

    if (!limit || now - limit.lastUsed > config.cooldown) {
      this.rateLimits.set(key, { lastUsed: now, count: 1 });
      return true;
    }

    if (limit.count >= config.max) return false;

    limit.count++;
    return true;
  }

  public getActiveSessionsCount(): number {
    return this.activeSessions.size / 2;
  }
}

export const menfesService = MenfesService.getInstance();
export default menfesService;
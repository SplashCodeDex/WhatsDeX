import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import logger from '../utils/logger.js';
import { Result } from '../types/index.js';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface DeviceInfo {
  id?: string;
  type?: string;
  os?: string;
  browser?: string;
  ip?: string;
  userAgent?: string;
  tags?: string[];
}

interface SessionData {
  id: string;
  data: any;
  created: number;
  lastUsed: number;
  expires: number;
  device: DeviceInfo;
}

interface SessionManagerOptions {
  sessionDir?: string;
  backupDir?: string;
  maxDevices?: number;
  sessionTimeout?: number;
  backupInterval?: number;
}

export class SessionManager {
  private static instance: SessionManager;
  private sessionDir: string;
  private backupDir: string;
  private maxDevices: number;
  private sessionTimeout: number;
  private backupInterval: number;
  private activeSessions: Map<string, SessionData>;
  private deviceSessions: Map<string, Set<SessionData>>;
  private sessionHistory: Map<string, any>;
  private recoveryPoints: Map<string, any>;

  private constructor(options: SessionManagerOptions = {}) {
    this.sessionDir = options.sessionDir || path.join(__dirname, '../../sessions');
    this.backupDir = options.backupDir || path.join(__dirname, '../../backups');
    this.maxDevices = options.maxDevices || 5;
    this.sessionTimeout = options.sessionTimeout || 30 * 24 * 60 * 60 * 1000;
    this.backupInterval = options.backupInterval || 60 * 60 * 1000;

    this.activeSessions = new Map();
    this.deviceSessions = new Map();
    this.sessionHistory = new Map();
    this.recoveryPoints = new Map();

    this.init();
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  private async init(): Promise<void> {
    try {
      await fs.mkdir(this.sessionDir, { recursive: true });
      await fs.mkdir(this.backupDir, { recursive: true });
      await this.loadExistingSessions();
      this.startBackupTimer();
    } catch (error: unknown) {
      logger.error('SessionManager init failed:', error);
    }
  }

  private async loadExistingSessions(): Promise<void> {
    try {
      const files = await fs.readdir(this.sessionDir);
      for (const file of files) {
        if (file.endsWith('.session')) {
          const sessionId = file.replace('.session', '');
          const result = await this.loadSessionFromFile(sessionId);
          if (result.success && result.data) {
            this.activeSessions.set(sessionId, result.data);
            this.indexDeviceSession(result.data);
          }
        }
      }
    } catch (error: unknown) {
      logger.error('Failed to load existing sessions:', error);
    }
  }

  async createSession(sessionData: any, deviceInfo: DeviceInfo = {}): Promise<Result<SessionData>> {
    try {
      const now = Date.now();
      const sessionId = crypto.randomBytes(16).toString('hex');
      
      const session: SessionData = {
        id: sessionId,
        data: sessionData,
        created: now,
        lastUsed: now,
        expires: now + this.sessionTimeout,
        device: {
          id: deviceInfo.id || crypto.randomBytes(8).toString('hex'),
          type: deviceInfo.type || 'unknown',
          os: deviceInfo.os || 'unknown',
          browser: deviceInfo.browser || 'unknown',
          ip: deviceInfo.ip || 'unknown',
          userAgent: deviceInfo.userAgent || 'unknown',
          tags: deviceInfo.tags || [],
        }
      };

      // Enforce device limit
      const deviceId = session.device.id!;
      const deviceSessions = this.getDeviceSessions(deviceId);
      if (deviceSessions.length >= this.maxDevices) {
        const oldestSession = deviceSessions.sort((a, b) => a.created - b.created)[0];
        await this.destroySession(oldestSession.id);
      }

      this.activeSessions.set(sessionId, session);
      this.indexDeviceSession(session);
      await this.saveSessionToFile(session);

      return { success: true, data: session };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      return { success: false, error: err };
    }
  }

  async getSession(sessionId: string): Promise<Result<SessionData | null>> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return { success: true, data: null };

    if (Date.now() > session.expires) {
      await this.destroySession(sessionId);
      return { success: true, data: null };
    }

    return { success: true, data: session };
  }

  async destroySession(sessionId: string): Promise<Result<void>> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      this.unindexDeviceSession(session);
      this.activeSessions.delete(sessionId);
      await this.deleteSessionFile(sessionId);
    }
    return { success: true, data: undefined };
  }

  getDeviceSessions(deviceId: string): SessionData[] {
    const sessions = this.deviceSessions.get(deviceId);
    return sessions ? Array.from(sessions) : [];
  }

  private indexDeviceSession(session: SessionData): void {
    const deviceId = session.device.id!;
    if (!this.deviceSessions.has(deviceId)) {
      this.deviceSessions.set(deviceId, new Set());
    }
    this.deviceSessions.get(deviceId)!.add(session);
  }

  private unindexDeviceSession(session: SessionData): void {
    const deviceId = session.device.id!;
    const sessions = this.deviceSessions.get(deviceId);
    if (sessions) {
      sessions.delete(session);
      if (sessions.size === 0) {
        this.deviceSessions.delete(deviceId);
      }
    }
  }

  private async saveSessionToFile(session: SessionData): Promise<void> {
    const filePath = path.join(this.sessionDir, `${session.id}.session`);
    await fs.writeFile(filePath, JSON.stringify(session), 'utf8');
  }

  private async loadSessionFromFile(sessionId: string): Promise<Result<SessionData | null>> {
    try {
      const filePath = path.join(this.sessionDir, `${sessionId}.session`);
      const content = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(content) as SessionData;
      return { success: true, data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  private async deleteSessionFile(sessionId: string): Promise<void> {
    try {
      const filePath = path.join(this.sessionDir, `${sessionId}.session`);
      await fs.unlink(filePath);
    } catch (error: unknown) {
      // Ignore if file doesn't exist
    }
  }

  private startBackupTimer(): void {
    const timer = setInterval(() => {
      this.performBackup();
    }, this.backupInterval);
    timer.unref();
  }

  private async performBackup(): Promise<void> {
    try {
      const files = await fs.readdir(this.sessionDir);
      const sessionFiles = files.filter(f => f.endsWith('.session'));
      
      if (sessionFiles.length === 0) return;

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(this.backupDir, `backup-${timestamp}`);
      await fs.mkdir(backupPath, { recursive: true });

      for (const file of sessionFiles) {
        await fs.copyFile(
          path.join(this.sessionDir, file),
          path.join(backupPath, file)
        );
      }

      logger.info(`Automated backup complete: ${sessionFiles.length} sessions backed up to ${backupPath}`);
      
      // Cleanup old backups (keep last 5)
      const backups = await fs.readdir(this.backupDir);
      const sortedBackups = backups
        .filter(b => b.startsWith('backup-'))
        .sort()
        .reverse();

      if (sortedBackups.length > 5) {
        for (let i = 5; i < sortedBackups.length; i++) {
          await fs.rm(path.join(this.backupDir, sortedBackups[i]), { recursive: true, force: true });
        }
      }
    } catch (error: any) {
      logger.error('Automated backup failed:', error);
    }
  }

  public getActiveSessions(): SessionData[] {
    return Array.from(this.activeSessions.values());
  }

  async stop(): Promise<void> {
    this.activeSessions.clear();
    this.deviceSessions.clear();
  }
}

export const sessionManager = SessionManager.getInstance();
export default sessionManager;
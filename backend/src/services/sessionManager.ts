import path from 'path';

import crypto from 'crypto';
import { promises as fs } from 'fs';
import logger from '../utils/logger';

/**
 * Ultra-Smart Session Manager
 * Multi-device session management with persistence and recovery
 */
class UltraSmartSessionManager {
  constructor(options = {}) {
    this.sessionDir = options.sessionDir || path.join(__dirname, '../../sessions');
    this.backupDir = options.backupDir || path.join(__dirname, '../../backups');
    this.maxDevices = options.maxDevices || 5;
    this.sessionTimeout = options.sessionTimeout || 30 * 24 * 60 * 60 * 1000; // 30 days
    this.backupInterval = options.backupInterval || 60 * 60 * 1000; // 1 hour

    // Session storage
    this.activeSessions = new Map();
    this.deviceSessions = new Map();
    this.sessionHistory = new Map();

    // Recovery data
    this.recoveryPoints = new Map();

    // Initialize directories
    this.initializeDirectories();

    // Start backup timer
    this.startBackupTimer();

    logger.info('Ultra-Smart Session Manager initialized', {
      sessionDir: this.sessionDir,
      maxDevices: this.maxDevices,
      sessionTimeout: this.sessionTimeout,
    });
  }

  /**
   * Initialize session directories
   */
  async initializeDirectories() {
    try {
      await fs.mkdir(this.sessionDir, { recursive: true });
      await fs.mkdir(this.backupDir, { recursive: true });
      await this.loadExistingSessions();
      logger.info('Session directories initialized');
    } catch (error) {
      logger.error('Failed to initialize session directories', { error: error.message });
    }
  }

  /**
   * Load existing sessions from disk
   */
  async loadExistingSessions() {
    try {
      const files = await fs.readdir(this.sessionDir);
      const sessionFiles = files.filter(file => file.endsWith('.session'));

      for (const file of sessionFiles) {
        try {
          const sessionId = file.replace('.session', '');
          const sessionData = await this.loadSessionFromFile(sessionId);

          if (sessionData && this.isSessionValid(sessionData)) {
            this.activeSessions.set(sessionId, sessionData);
            this.indexDeviceSession(sessionData);
          } else {
            // Clean up invalid session
            await this.deleteSessionFile(sessionId);
          }
        } catch (error) {
          logger.warn('Failed to load session file', { file, error: error.message });
        }
      }

      logger.info('Existing sessions loaded', { count: this.activeSessions.size });
    } catch (error) {
      logger.error('Failed to load existing sessions', { error: error.message });
    }
  }

  /**
   * Create new session
   */
  async createSession(sessionData, deviceInfo = {}) {
    const sessionId = crypto.randomUUID();
    const now = Date.now();

    const session = {
      id: sessionId,
      created: now,
      lastActivity: now,
      expires: now + this.sessionTimeout,
      data: sessionData,
      device: {
        id: deviceInfo.id || crypto.randomBytes(8).toString('hex'),
        type: deviceInfo.type || 'unknown',
        os: deviceInfo.os || 'unknown',
        browser: deviceInfo.browser || 'unknown',
        ip: deviceInfo.ip || 'unknown',
        userAgent: deviceInfo.userAgent || 'unknown',
        ...deviceInfo,
      },
      metadata: {
        version: '1.0',
        createdBy: 'UltraSmartSessionManager',
        tags: deviceInfo.tags || [],
      },
      stats: {
        connections: 1,
        reconnections: 0,
        dataTransferred: 0,
        lastBackup: null,
      },
    };

    // Check device limit
    const deviceSessions = this.getDeviceSessions(session.device.id);
    if (deviceSessions.length >= this.maxDevices) {
      // Remove oldest session for this device
      const oldestSession = deviceSessions.sort((a, b) => a.created - b.created)[0];
      await this.destroySession(oldestSession.id);
    }

    // Save session
    this.activeSessions.set(sessionId, session);
    this.indexDeviceSession(session);

    // Persist to disk
    await this.saveSessionToFile(session);

    // Create recovery point
    await this.createRecoveryPoint(session);

    logger.info('Session created', {
      sessionId,
      deviceId: session.device.id,
      deviceType: session.device.type,
    });

    return session;
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId) {
    const session = this.activeSessions.get(sessionId);

    if (!session) {
      return null;
    }

    // Check if session is expired
    if (!this.isSessionValid(session)) {
      await this.destroySession(sessionId);
      return null;
    }

    // Update last activity
    session.lastActivity = Date.now();
    await this.saveSessionToFile(session);

    return session;
  }

  /**
   * Update session data
   */
  async updateSession(sessionId, updates) {
    const session = await this.getSession(sessionId);

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Update session data
    Object.assign(session.data, updates);
    session.lastActivity = Date.now();

    // Update stats
    if (updates.dataTransferred) {
      session.stats.dataTransferred += updates.dataTransferred;
    }

    // Save updated session
    await this.saveSessionToFile(session);

    logger.debug('Session updated', { sessionId, updates: Object.keys(updates) });

    return session;
  }

  /**
   * Destroy session
   */
  async destroySession(sessionId) {
    const session = this.activeSessions.get(sessionId);

    if (!session) {
      return false;
    }

    // Remove from memory
    this.activeSessions.delete(sessionId);
    this.unindexDeviceSession(session);

    // Remove from disk
    await this.deleteSessionFile(sessionId);

    // Add to history
    this.sessionHistory.set(sessionId, {
      ...session,
      destroyed: Date.now(),
      reason: 'manual',
    });

    logger.info('Session destroyed', {
      sessionId,
      deviceId: session.device.id,
      duration: Date.now() - session.created,
    });

    return true;
  }

  /**
   * Get all sessions for a device
   */
  getDeviceSessions(deviceId) {
    return Array.from(this.deviceSessions.get(deviceId) || []);
  }

  /**
   * Transfer session to another device
   */
  async transferSession(sessionId, newDeviceInfo) {
    const session = await this.getSession(sessionId);

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Check device limit for new device
    const newDeviceSessions = this.getDeviceSessions(newDeviceInfo.id);
    if (newDeviceSessions.length >= this.maxDevices) {
      throw new Error(`Device ${newDeviceInfo.id} has reached maximum session limit`);
    }

    // Update device info
    const oldDeviceId = session.device.id;
    session.device = { ...session.device, ...newDeviceInfo };
    session.stats.reconnections++;

    // Re-index session
    this.unindexDeviceSession(session);
    this.indexDeviceSession(session);

    // Save updated session
    await this.saveSessionToFile(session);

    logger.info('Session transferred', {
      sessionId,
      fromDevice: oldDeviceId,
      toDevice: newDeviceInfo.id,
    });

    return session;
  }

  /**
   * Clone session for multi-device support
   */
  async cloneSession(sessionId, newDeviceInfo) {
    const originalSession = await this.getSession(sessionId);

    if (!originalSession) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Check device limit
    const deviceSessions = this.getDeviceSessions(newDeviceInfo.id);
    if (deviceSessions.length >= this.maxDevices) {
      throw new Error(`Device ${newDeviceInfo.id} has reached maximum session limit`);
    }

    // Create cloned session
    const clonedSession = {
      ...originalSession,
      id: crypto.randomUUID(),
      created: Date.now(),
      device: { ...originalSession.device, ...newDeviceInfo },
      stats: { ...originalSession.stats, connections: 1, reconnections: 0 },
    };

    // Save cloned session
    this.activeSessions.set(clonedSession.id, clonedSession);
    this.indexDeviceSession(clonedSession);
    await this.saveSessionToFile(clonedSession);

    logger.info('Session cloned', {
      originalSessionId: sessionId,
      clonedSessionId: clonedSession.id,
      deviceId: newDeviceInfo.id,
    });

    return clonedSession;
  }

  /**
   * Recover session from backup
   */
  async recoverSession(sessionId) {
    try {
      // Try to load from backup
      const backupData = await this.loadBackup(sessionId);

      if (backupData && this.isSessionValid(backupData)) {
        // Restore session
        this.activeSessions.set(sessionId, backupData);
        this.indexDeviceSession(backupData);
        await this.saveSessionToFile(backupData);

        logger.info('Session recovered from backup', { sessionId });

        return backupData;
      }
    } catch (error) {
      logger.error('Failed to recover session', { sessionId, error: error.message });
    }

    return null;
  }

  /**
   * Create recovery point
   */
  async createRecoveryPoint(session) {
    const recoveryId = `${session.id}_${Date.now()}`;
    const recoveryData = {
      sessionId: session.id,
      timestamp: Date.now(),
      data: JSON.stringify(session),
      checksum: crypto.createHash('sha256').update(JSON.stringify(session)).digest('hex'),
    };

    this.recoveryPoints.set(recoveryId, recoveryData);

    // Save to backup file
    await this.saveBackup(session.id, recoveryData);

    // Clean old recovery points (keep last 10)
    const sessionRecoveryPoints = Array.from(this.recoveryPoints.entries())
      .filter(([key]) => key.startsWith(`${session.id}_`))
      .sort((a, b) => b[1].timestamp - a[1].timestamp);

    if (sessionRecoveryPoints.length > 10) {
      for (const [key] of sessionRecoveryPoints.slice(10)) {
        this.recoveryPoints.delete(key);
      }
    }
  }

  /**
   * Get session statistics
   */
  getSessionStats() {
    const now = Date.now();
    const activeCount = this.activeSessions.size;

    const deviceStats = {};
    for (const [deviceId, sessions] of this.deviceSessions.entries()) {
      deviceStats[deviceId] = {
        count: sessions.size,
        types: [...new Set(Array.from(sessions).map(s => s.device.type))],
      };
    }

    const sessionDurations = Array.from(this.activeSessions.values()).map(
      session => now - session.created
    );

    const averageDuration =
      sessionDurations.length > 0
        ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length
        : 0;

    return {
      activeSessions: activeCount,
      totalDevices: this.deviceSessions.size,
      deviceStats,
      averageSessionDuration: Math.round(averageDuration / 1000 / 60), // minutes
      recoveryPoints: this.recoveryPoints.size,
      sessionHistory: this.sessionHistory.size,
    };
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions() {
    const now = Date.now();
    let cleaned = 0;

    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.expires < now) {
        await this.destroySession(sessionId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info('Cleaned up expired sessions', { cleaned });
    }

    return cleaned;
  }

  /**
   * Backup all sessions
   */
  async backupAllSessions() {
    try {
      const backupData = {
        timestamp: Date.now(),
        sessions: Array.from(this.activeSessions.values()),
        metadata: {
          version: '1.0',
          totalSessions: this.activeSessions.size,
          checksum: '',
        },
      };

      // Calculate checksum
      const dataString = JSON.stringify(backupData.sessions);
      backupData.metadata.checksum = crypto.createHash('sha256').update(dataString).digest('hex');

      // Save backup
      const backupFile = path.join(this.backupDir, `sessions_backup_${Date.now()}.json`);
      await fs.writeFile(backupFile, JSON.stringify(backupData, null, 2));

      // Update last backup time for all sessions
      for (const session of this.activeSessions.values()) {
        session.stats.lastBackup = Date.now();
        await this.saveSessionToFile(session);
      }

      logger.info('Sessions backup completed', {
        file: backupFile,
        sessionsCount: backupData.sessions.length,
      });
    } catch (error) {
      logger.error('Failed to backup sessions', { error: error.message });
    }
  }

  /**
   * Restore sessions from backup
   */
  async restoreFromBackup(backupFile) {
    try {
      const backupPath = path.join(this.backupDir, backupFile);
      const backupData = JSON.parse(await fs.readFile(backupPath, 'utf8'));

      // Validate backup
      const dataString = JSON.stringify(backupData.sessions);
      const checksum = crypto.createHash('sha256').update(dataString).digest('hex');

      if (checksum !== backupData.metadata.checksum) {
        throw new Error('Backup checksum validation failed');
      }

      // Restore sessions
      let restored = 0;
      for (const session of backupData.sessions) {
        if (this.isSessionValid(session)) {
          this.activeSessions.set(session.id, session);
          this.indexDeviceSession(session);
          await this.saveSessionToFile(session);
          restored++;
        }
      }

      logger.info('Sessions restored from backup', {
        file: backupFile,
        restored,
        total: backupData.sessions.length,
      });

      return restored;
    } catch (error) {
      logger.error('Failed to restore from backup', { backupFile, error: error.message });
      throw error;
    }
  }

  /**
   * Index session by device
   */
  indexDeviceSession(session) {
    const deviceId = session.device.id;
    if (!this.deviceSessions.has(deviceId)) {
      this.deviceSessions.set(deviceId, new Set());
    }
    this.deviceSessions.get(deviceId).add(session);
  }

  /**
   * Remove session from device index
   */
  unindexDeviceSession(session) {
    const deviceId = session.device.id;
    const deviceSessions = this.deviceSessions.get(deviceId);
    if (deviceSessions) {
      deviceSessions.delete(session);
      if (deviceSessions.size === 0) {
        this.deviceSessions.delete(deviceId);
      }
    }
  }

  /**
   * Check if session is valid
   */
  isSessionValid(session) {
    return session.expires > Date.now();
  }

  /**
   * Save session to file
   */
  async saveSessionToFile(session) {
    try {
      const filePath = path.join(this.sessionDir, `${session.id}.session`);
      await fs.writeFile(filePath, JSON.stringify(session, null, 2));
    } catch (error) {
      logger.error('Failed to save session to file', {
        sessionId: session.id,
        error: error.message,
      });
    }
  }

  /**
   * Load session from file
   */
  async loadSessionFromFile(sessionId) {
    try {
      const filePath = path.join(this.sessionDir, `${sessionId}.session`);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  /**
   * Delete session file
   */
  async deleteSessionFile(sessionId) {
    try {
      const filePath = path.join(this.sessionDir, `${sessionId}.session`);
      await fs.unlink(filePath);
    } catch (error) {
      // File might not exist, ignore error
    }
  }

  /**
   * Save backup
   */
  async saveBackup(sessionId, backupData) {
    try {
      const backupFile = path.join(this.backupDir, `${sessionId}_backup.json`);
      await fs.writeFile(backupFile, JSON.stringify(backupData, null, 2));
    } catch (error) {
      logger.error('Failed to save backup', { sessionId, error: error.message });
    }
  }

  /**
   * Load backup
   */
  async loadBackup(sessionId) {
    try {
      const backupFile = path.join(this.backupDir, `${sessionId}_backup.json`);
      const data = await fs.readFile(backupFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  /**
   * Start backup timer
   */
  startBackupTimer() {
    setInterval(() => {
      this.backupAllSessions();
    }, this.backupInterval);
  }

  /**
   * Get all active sessions
   */
  getActiveSessions() {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Get session by device ID
   */
  getSessionsByDevice(deviceId) {
    return this.getDeviceSessions(deviceId);
  }

  /**
   * Force disconnect device
   */
  async disconnectDevice(deviceId) {
    const deviceSessions = this.getDeviceSessions(deviceId);
    let disconnected = 0;

    for (const session of deviceSessions) {
      await this.destroySession(session.id);
      disconnected++;
    }

    logger.info('Device disconnected', { deviceId, sessionsDisconnected: disconnected });

    return disconnected;
  }

  /**
   * Shutdown and cleanup
   */
  async shutdown() {
    logger.info('Shutting down Ultra-Smart Session Manager');

    // Save all sessions before shutdown
    await this.backupAllSessions();

    // Clear all data
    this.activeSessions.clear();
    this.deviceSessions.clear();
    this.recoveryPoints.clear();

    logger.info('Ultra-Smart Session Manager shutdown complete');
  }
}

export default UltraSmartSessionManager;

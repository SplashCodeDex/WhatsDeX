
const { EventEmitter } = require('events');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs').promises;

/**
 * Single, intelligent authentication manager that properly integrates with Baileys
 * and provides a unified interface for QR code and pairing code authentication.
 */
class UnifiedSmartAuth extends EventEmitter {
    constructor(config, client) {
        super();
        this.client = client;
        this.authState = 'disconnected';
        this.learningData = {}; // For future AI enhancements
        this.lastError = null;
        this.config = config;

        logger.info('UnifiedSmartAuth initialized');
        this.setupEventHandlers();
    }

    /**
     * Setup event handlers for the Baileys client
     */
    setupEventHandlers() {
        if (!this.client) {
            logger.warn('Cannot setup event handlers without a client');
            return;
        }

        this.client.ev.on('connection.update', (update) => {
            const { connection, qr, isNewLogin, lastDisconnect } = update;
            if (connection === 'connecting') {
                this.authState = 'connecting';
            } else if (connection === 'open') {
                this.authState = 'connected';
                this.emit('authenticated');
            } else if (connection === 'close') {
                this.authState = 'disconnected';
                this.lastError = lastDisconnect?.error?.output?.statusCode;
                this.emit('disconnected', this.lastError);
            }

            if (qr) {
                this.emit('qr', qr);
            }

            if (isNewLogin) {
                // Handle new login, e.g., clear old session data if necessary
            }
        });

        this.client.ev.on('creds.update', () => {
            // This event is handled in main.js
        });
    }

    async detectExistingSession() {
        try {
            const statePath = path.join(__dirname, '..', '..', 'state');
            const credsPath = path.join(statePath, 'creds.json');

            const credsExists = await this.checkPathExists(credsPath);

            if (!credsExists) {
                return { hasSession: false, isValid: false, reason: 'No session files found' };
            }

            const credsContent = await fs.readFile(credsPath, 'utf8');
            const credsData = JSON.parse(credsContent);

            // Baileys creds.json structure is different. We need to check for presence of keys.
            const isValid = credsData.noiseKey && credsData.signedIdentityKey && credsData.signedPreKey;

            if (isValid) {
                return {
                    hasSession: true,
                    isValid: true,
                    sessionInfo: {
                        // Baileys creds.json doesn't directly store phone number or registrationId
                        // We can infer it after connection is established.
                        phoneNumber: null,
                        registrationId: null,
                    }
                };
            }

            return { hasSession: false, isValid: false, reason: 'Session exists but not valid' };
        } catch (error) {
            return { hasSession: false, isValid: false, reason: 'Detection failed' };
        }
    }

    async checkPathExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    async analyzeCredsFile(credsPath) {
        try {
            const credsContent = await fs.readFile(credsPath, 'utf8');
            const credsData = JSON.parse(credsContent);

            return {
                hasKeys: !!(credsData.noiseKey && credsData.signedIdentityKey && credsData.signedPreKey),
                hasRegistration: true, // Baileys handles registration internally
                hasPhoneNumber: !!(credsData.me && credsData.me.id),
                phoneNumber: credsData.me?.id || null,
            };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = UnifiedSmartAuth;

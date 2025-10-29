/**
 * Multi-Bot Service - Allow users to create their own bot instances
 * Implements JadiBot functionality with proper session management
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { Boom } = require('@hapi/boom');
const NodeCache = require('node-cache');
const { default: WAConnection, useMultiFileAuthState, Browsers, DisconnectReason, makeCacheableSignalKeyStore, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');

class MultiBotService {
    constructor() {
        this.activeBots = new Map();
        this.botProcesses = new Map();
        this.msgRetryCounterCache = new NodeCache();
        this.groupCache = new NodeCache({ stdTTL: 5 * 60, useClones: false });
        this.rateLimits = new Map();
        this.botsDir = path.join(process.cwd(), 'database', 'jadibot');
    }

    /**
     * Initialize service
     */
    async initialize() {
        try {
            await this.ensureBotsDirectory();
            await this.loadExistingBots();
        } catch (error) {
            console.error('Error initializing multi-bot service:', error);
        }
    }

    /**
     * Create new bot instance for user
     * @param {string} userId - User ID who wants to create bot
     * @param {Object} mainBot - Main bot instance for store access
     */
    async createBot(userId, mainBot) {
        try {
            // Check rate limit
            if (!this.checkRateLimit(userId, 'create_bot')) {
                throw new Error('Rate limit exceeded. Please wait before creating new bot.');
            }

            // Check if user already has active bot
            if (this.activeBots.has(userId)) {
                throw new Error('You already have an active bot instance!');
            }

            const botData = {
                id: userId,
                userId,
                createdAt: Date.now(),
                isActive: true,
                reconnectAttempts: 0,
                maxReconnectAttempts: 5
            };

            this.activeBots.set(userId, botData);

            // Start bot process
            await this.startBotProcess(userId, mainBot);

            return {
                success: true,
                message: 'Bot instance created successfully! Use the pairing code to connect.',
                botId: userId
            };

        } catch (error) {
            console.error('Error creating bot:', error);
            throw error;
        }
    }

    /**
     * Start bot process for user
     * @param {string} userId - User ID
     * @param {Object} mainBot - Main bot instance
     */
    async startBotProcess(userId, mainBot) {
        try {
            const { state, saveCreds } = await useMultiFileAuthState(path.join(this.botsDir, userId));
            const { version, isLatest } = await fetchLatestBaileysVersion();

            const bot = WAConnection({
                isLatest,
                logger: require('pino')({ level: 'silent' }),
                getMessage: async (key) => {
                    if (mainBot.store) {
                        const msg = await mainBot.store.loadMessage(key.remoteJid, key.id);
                        return msg?.message || '';
                    }
                    return { conversation: 'Halo Saya Adalah Bot' };
                },
                syncFullHistory: false,
                maxMsgRetryCount: 15,
                msgRetryCounterCache: this.msgRetryCounterCache,
                retryRequestDelayMs: 10,
                defaultQueryTimeoutMs: 0,
                cachedGroupMetadata: async (jid) => this.groupCache.get(jid),
                browser: Browsers.ubuntu('Chrome'),
                transactionOpts: {
                    maxCommitRetries: 10,
                    delayBetweenTriesMs: 10,
                },
                appStateMacVerification: {
                    patch: true,
                    snapshot: true,
                },
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, require('pino')({ level: 'silent' })),
                },
            });

            // Set up event handlers
            this.setupBotEventHandlers(bot, userId, mainBot);

            // Store bot instance
            this.botProcesses.set(userId, bot);

            return bot;

        } catch (error) {
            console.error('Error starting bot process:', error);
            throw new Error('Failed to start bot process');
        }
    }

    /**
     * Set up event handlers for bot
     * @param {Object} bot - Bot instance
     * @param {string} userId - User ID
     * @param {Object} mainBot - Main bot instance
     */
    setupBotEventHandlers(bot, userId, mainBot) {
        // Save credentials on update
        bot.ev.on('creds.update', async () => {
            try {
                await saveCreds();
            } catch (error) {
                console.error('Error saving bot credentials:', error);
            }
        });

        // Handle connection updates
        bot.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, receivedPendingNotifications } = update;

            if (connection === 'close') {
                const reason = new Boom(lastDisconnect?.error)?.output.statusCode;

                if ([DisconnectReason.connectionLost, DisconnectReason.connectionClosed, DisconnectReason.restartRequired, DisconnectReason.timedOut, DisconnectReason.badSession, DisconnectReason.connectionReplaced].includes(reason)) {
                    console.log(`Bot ${userId} connection lost, attempting to reconnect...`);
                    await this.handleBotReconnection(userId, mainBot);
                } else if (reason === DisconnectReason.loggedOut) {
                    console.log(`Bot ${userId} logged out`);
                    await this.stopBot(userId, 'logged_out');
                } else if (reason === DisconnectReason.multideviceMismatch) {
                    console.log(`Bot ${userId} multidevice mismatch`);
                    await this.stopBot(userId, 'multidevice_mismatch');
                } else {
                    console.log(`Bot ${userId} disconnected: ${reason}`);
                    await this.stopBot(userId, 'unknown_disconnect');
                }
            }

            if (connection === 'open') {
                console.log(`Bot ${userId} connected successfully`);
                const botData = this.activeBots.get(userId);
                if (botData) {
                    botData.reconnectAttempts = 0;
                }
            }

            if (receivedPendingNotifications === 'true') {
                bot.ev.flush();
            }
        });

        // Handle messages (forward to main bot logic)
        bot.ev.on('messages.upsert', async (message) => {
            try {
                // Process messages through main bot's message handler
                await mainBot.messageHandler(bot, message);
            } catch (error) {
                console.error('Error processing bot message:', error);
            }
        });
    }

    /**
     * Handle bot reconnection
     * @param {string} userId - User ID
     * @param {Object} mainBot - Main bot instance
     */
    async handleBotReconnection(userId, mainBot) {
        try {
            const botData = this.activeBots.get(userId);
            if (!botData) return;

            if (botData.reconnectAttempts >= botData.maxReconnectAttempts) {
                console.log(`Max reconnection attempts reached for bot ${userId}`);
                await this.stopBot(userId, 'max_reconnect_attempts');
                return;
            }

            botData.reconnectAttempts++;

            // Wait before reconnecting
            setTimeout(async () => {
                try {
                    const bot = this.botProcesses.get(userId);
                    if (bot && !bot.user) {
                        await this.startBotProcess(userId, mainBot);
                    }
                } catch (error) {
                    console.error(`Error reconnecting bot ${userId}:`, error);
                }
            }, 5000);

        } catch (error) {
            console.error('Error handling bot reconnection:', error);
        }
    }

    /**
     * Stop bot instance
     * @param {string} userId - User ID
     * @param {string} reason - Reason for stopping
     */
    async stopBot(userId, reason = 'manual') {
        try {
            const bot = this.botProcesses.get(userId);
            if (bot) {
                bot.end('Stop');
                bot.ev.removeAllListeners();
                this.botProcesses.delete(userId);
            }

            // Remove from active bots
            this.activeBots.delete(userId);

            // Clean up bot directory
            try {
                const botDir = path.join(this.botsDir, userId);
                await fs.rm(botDir, { recursive: true, force: true });
            } catch (error) {
                console.error('Error cleaning up bot directory:', error);
            }

            console.log(`Bot ${userId} stopped. Reason: ${reason}`);

            return {
                success: true,
                message: 'Bot instance stopped successfully',
                reason
            };

        } catch (error) {
            console.error('Error stopping bot:', error);
            throw new Error('Failed to stop bot');
        }
    }

    /**
     * Get bot list
     */
    getActiveBots() {
        return Array.from(this.activeBots.entries()).map(([userId, data]) => ({
            userId,
            createdAt: data.createdAt,
            isActive: data.isActive,
            reconnectAttempts: data.reconnectAttempts
        }));
    }

    /**
     * Get bot by user ID
     * @param {string} userId - User ID
     */
    getBot(userId) {
        return this.activeBots.get(userId);
    }

    /**
     * Check if user has active bot
     * @param {string} userId - User ID
     */
    hasActiveBot(userId) {
        return this.activeBots.has(userId);
    }

    /**
     * Check rate limit for bot operations
     * @param {string} userId - User ID
     * @param {string} operation - Operation type
     */
    async checkRateLimit(userId, operation) {
        const limits = {
            'create_bot': { cooldown: 300000, maxPerCooldown: 1 }, // 5 minutes
            'stop_bot': { cooldown: 60000, maxPerCooldown: 3 }, // 1 minute
        };
        const config = limits[operation] || { cooldown: 60000, maxPerCooldown: 1 };

        const key = `${userId}_${operation}`;
        const now = new Date();
        const expiresAt = new Date(now.getTime() + config.cooldown);

        const rateLimit = await prisma.rateLimit.upsert({
            where: { key },
            update: { count: { increment: 1 } },
            create: { key, count: 1, expiresAt },
        });

        if (rateLimit.expiresAt < now) {
            await prisma.rateLimit.update({
                where: { key },
                data: { count: 1, expiresAt },
            });
            return true;
        }

        return rateLimit.count <= config.maxPerCooldown;
    }

    /**
     * Ensure bots directory exists
     */
    async ensureBotsDirectory() {
        try {
            await fs.access(this.botsDir);
        } catch (error) {
            await fs.mkdir(this.botsDir, { recursive: true });
        }
    }

    /**
     * Load existing bots on startup
     */
    async loadExistingBots() {
        try {
            const botsDir = await fs.readdir(this.botsDir);

            for (const botDir of botsDir) {
                const botPath = path.join(this.botsDir, botDir);
                const stat = await fs.stat(botPath);

                if (stat.isDirectory()) {
                    // Check if bot directory has auth files
                    const files = await fs.readdir(botPath);
                    const hasAuth = files.some(file => file.includes('creds'));

                    if (hasAuth) {
                        this.activeBots.set(botDir, {
                            id: botDir,
                            userId: botDir,
                            createdAt: stat.birthtime.getTime(),
                            isActive: false,
                            needsRestart: true
                        });
                    }
                }
            }

        } catch (error) {
            console.error('Error loading existing bots:', error);
        }
    }

    /**
     * Clean up inactive bots
     */
    async cleanupInactiveBots() {
        const now = Date.now();
        const maxInactiveTime = 24 * 60 * 60 * 1000; // 24 hours

        for (const [userId, botData] of this.activeBots.entries()) {
            if (!botData.isActive && (now - botData.createdAt) > maxInactiveTime) {
                try {
                    const botDir = path.join(this.botsDir, userId);
                    await fs.rm(botDir, { recursive: true, force: true });
                    this.activeBots.delete(userId);
                } catch (error) {
                    console.error('Error cleaning up inactive bot:', error);
                }
            }
        }
    }

    /**
     * Get bot statistics
     */
    getStats() {
        return {
            activeBots: this.activeBots.size,
            runningProcesses: this.botProcesses.size,
            totalBots: this.activeBots.size
        };
    }
}

module.exports = new MultiBotService();
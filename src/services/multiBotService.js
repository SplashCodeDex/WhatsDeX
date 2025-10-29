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
const context = require('../../context');

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
            // Check rate limit from database
            const rateLimitKey = `multibot_create_${userId}`;
            const existingLimit = await context.database.rateLimit.findUnique({
                where: { key: rateLimitKey }
            });

            const now = Date.now();
            const cooldown = 5 * 60 * 1000; // 5 minutes

            if (existingLimit && (now - existingLimit.lastUsed.getTime()) < cooldown && existingLimit.count >= 1) {
                throw new Error('Rate limit exceeded. Please wait before creating new bot.');
            }

            // Check if user already has active bot in database
            const existingBot = await context.database.multiBot.findUnique({
                where: { userId }
            });

            if (existingBot && existingBot.isActive) {
                throw new Error('You already have an active bot instance!');
            }

            // Create bot record in database
            const botData = await context.database.multiBot.upsert({
                where: { userId },
                update: {
                    isActive: true,
                    reconnectAttempts: 0,
                    updatedAt: new Date()
                },
                create: {
                    userId,
                    isActive: true,
                    reconnectAttempts: 0,
                    maxReconnectAttempts: 5
                }
            });

            // Update rate limit
            await context.database.rateLimit.upsert({
                where: { key: rateLimitKey },
                update: {
                    count: { increment: 1 },
                    lastUsed: new Date()
                },
                create: {
                    key: rateLimitKey,
                    count: 1,
                    lastUsed: new Date()
                }
            });

            this.activeBots.set(userId, {
                id: botData.id,
                userId: botData.userId,
                createdAt: botData.createdAt.getTime(),
                isActive: botData.isActive,
                reconnectAttempts: botData.reconnectAttempts,
                maxReconnectAttempts: botData.maxReconnectAttempts
            });

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

            // Update database record
            await context.database.multiBot.updateMany({
                where: { userId },
                data: {
                    isActive: false,
                    stoppedAt: new Date(),
                    stopReason: reason,
                    updatedAt: new Date()
                }
            });

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
     * Check rate limit for bot operations (now uses database)
     * @param {string} userId - User ID
     * @param {string} operation - Operation type
     */
    async checkRateLimit(userId, operation) {
        const key = `multibot_${operation}_${userId}`;
        const now = Date.now();

        const limits = {
            'create_bot': { cooldown: 300000, maxPerCooldown: 1 }, // 5 minutes, 1 bot
            'stop_bot': { cooldown: 60000, maxPerCooldown: 3 } // 1 minute, 3 operations
        };

        const config = limits[operation] || { cooldown: 60000, maxPerCooldown: 1 };

        try {
            const existingLimit = await context.database.rateLimit.findUnique({
                where: { key }
            });

            if (!existingLimit || (now - existingLimit.lastUsed.getTime()) > config.cooldown) {
                await context.database.rateLimit.upsert({
                    where: { key },
                    update: {
                        count: 1,
                        lastUsed: new Date()
                    },
                    create: {
                        key,
                        count: 1,
                        lastUsed: new Date()
                    }
                });
                return true;
            }

            if (existingLimit.count >= config.maxPerCooldown) {
                return false;
            }

            await context.database.rateLimit.update({
                where: { key },
                data: {
                    count: { increment: 1 },
                    lastUsed: new Date()
                }
            });

            return true;
        } catch (error) {
            console.error('Error checking rate limit:', error);
            return false; // Fail safe
        }
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
            // Load from database instead of file system
            const bots = await context.database.multiBot.findMany({
                where: { isActive: true }
            });

            for (const bot of bots) {
                this.activeBots.set(bot.userId, {
                    id: bot.id,
                    userId: bot.userId,
                    createdAt: bot.createdAt.getTime(),
                    isActive: bot.isActive,
                    reconnectAttempts: bot.reconnectAttempts,
                    maxReconnectAttempts: bot.maxReconnectAttempts,
                    needsRestart: !bot.isActive
                });
            }

            // Also check file system for any orphaned directories
            const botsDir = await fs.readdir(this.botsDir);

            for (const botDir of botsDir) {
                const botPath = path.join(this.botsDir, botDir);
                const stat = await fs.stat(botPath);

                if (stat.isDirectory() && !this.activeBots.has(botDir)) {
                    // Check if bot directory has auth files
                    const files = await fs.readdir(botPath);
                    const hasAuth = files.some(file => file.includes('creds'));

                    if (hasAuth) {
                        // Create database record for orphaned bot
                        await context.database.multiBot.create({
                            data: {
                                userId: botDir,
                                isActive: false,
                                reconnectAttempts: 0,
                                maxReconnectAttempts: 5
                            }
                        });

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
        try {
            const maxInactiveTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

            // Find inactive bots older than 24 hours
            const inactiveBots = await context.database.multiBot.findMany({
                where: {
                    isActive: false,
                    updatedAt: {
                        lt: maxInactiveTime
                    }
                }
            });

            for (const bot of inactiveBots) {
                try {
                    // Clean up bot directory
                    const botDir = path.join(this.botsDir, bot.userId);
                    await fs.rm(botDir, { recursive: true, force: true });

                    // Remove from database
                    await context.database.multiBot.delete({
                        where: { id: bot.id }
                    });

                    this.activeBots.delete(bot.userId);
                } catch (error) {
                    console.error('Error cleaning up inactive bot:', error);
                }
            }
        } catch (error) {
            console.error('Error in cleanupInactiveBots:', error);
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

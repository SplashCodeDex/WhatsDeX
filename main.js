// Import required modules and dependencies
const middleware = require("./middleware.js");
const events = require("./events/handler.js");
const {
    Client,
    CommandHandler
} = require("@itsreimau/gktw");
const UnifiedSmartAuth = require("./src/services/auth/UnifiedSmartAuth");
const path = require("node:path");
const util = require("node:util");

module.exports = async (context) => {
    const { config, consolefy } = context;

    // Create bot instance
    const bot = new Client({
        authDir: path.resolve(__dirname, config.bot.authDir), // Assuming default authDir for now
        WAVersion: [2, 3000, 1025091846],
        printQRInTerminal: true, // Always print QR for initial setup
        phoneNumber: config.bot.phoneNumber || null,
        usePairingCode: false, // Let UnifiedSmartAuth decide
        customPairingCode: config.system.customPairingCode,
        useStore: config.system.useStore,
        readIncomingMsg: config.system.autoRead,
        markOnlineOnConnect: config.system.alwaysOnline,
        prefix: config.bot.prefix,
        selfReply: config.system.selfReply,
        autoMention: config.system.autoMention,
        autoAiLabel: config.system.autoAiLabel,
        context
    });
    bot.context = context;

    // Initialize Unified Smart Authentication
    const unifiedAuth = new UnifiedSmartAuth(bot);

    // Store unifiedAuth reference in context for later use
    context.unifiedAuth = unifiedAuth;

    // Initialize events and middleware
    events(bot, context);
    middleware(bot, context);

    // Load and run command handler
    const cmd = new CommandHandler(bot, path.resolve(__dirname, "commands"));
    cmd.load();

    try {
        console.log("🧠 Initializing Unified Smart Authentication...");

        // Listen for authentication events
        unifiedAuth.on('connected', () => {
            consolefy.info(`✅ Bot connected to WhatsApp!`);
        });

        unifiedAuth.on('disconnected', (error) => {
            consolefy.error(`❌ Bot disconnected from WhatsApp: ${error ? error.message : 'Unknown error'}`);
            // Implement reconnection logic or exit
            process.exit(1);
        });

        unifiedAuth.on('error', (error) => {
            consolefy.error(`⚠️  Authentication error: ${error.message}`);
            // Handle specific errors, e.g., display QR/pairing code
        });

        // Connect to WhatsApp
        await unifiedAuth.connect();

    } catch (error) {
        console.error(`❌ Fatal Error during Unified Smart Authentication: ${util.format(error)}`);
        process.exit(1);
    }
};
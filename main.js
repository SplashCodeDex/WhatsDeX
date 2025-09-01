// Import required modules and dependencies
const middleware = require("./middleware.js");
const events = require("./events/handler.js");
const {
    Client,
    CommandHandler
} = require("@itsreimau/gktw");
const path = require("node:path");
const util = require("node:util");

module.exports = (context) => {
    const { config, consolefy } = context;

    // Bot configuration from 'config.js' file
    const {
        bot: botConfig,
        system
    } = config;
    const {
        authAdapter
    } = botConfig;

    // Select authentication adapter
    const adapters = {
        mysql: () => require("baileys-mysql").useSqlAuthState(authAdapter.mysql),
        mongodb: () => require("baileys-mongodb").useMongoAuthState(authAdapter.mongodb.url),
        firebase: () => require("baileys-firebase").useFireAuthState(authAdapter.firebase)
    };
    const selectedAuthAdapter = adapters[authAdapter.adapter] ? adapters[authAdapter.adapter]() : null;

    consolefy.log("Connecting..."); // Logging connection process

    // Create bot instance
    const bot = new Client({
        authDir: authAdapter.adapter === "default" ? path.resolve(__dirname, authAdapter.default.authDir) : null,
        authAdapter: selectedAuthAdapter,
        WAVersion: [2, 3000, 1025091846],
        printQRInTerminal: false,
        phoneNumber: botConfig.phoneNumber,
        usePairingCode: system.usePairingCode,
        customPairingCode: system.customPairingCode,
        useStore: system.useStore,
        readIncomingMsg: system.autoRead,
        markOnlineOnConnect: system.alwaysOnline,
        prefix: botConfig.prefix,
        selfReply: system.selfReply,
        autoMention: system.autoMention,
        autoAiLabel: system.autoAiLabel,
        context
    });
    bot.context = context;

    // Initialize events and middleware
    events(bot, context);
    middleware(bot, context);

    // Load and run command handler
    const cmd = new CommandHandler(bot, path.resolve(__dirname, "commands"));
    cmd.load();

    bot.launch().catch(error => consolefy.error(`Error: ${util.format(error)}`)); // Launch the bot
};

// Import necessary modules and dependencies
const {
    Formatter
} = require("@itsreimau/gktw");

// Configuration
global.config = {
    // Basic bot information
    bot: {
        name: "whatsdex", // Bot name
        prefix: /^[°•π÷×¶∆£¢€¥®™+✓_=|/~!?@#%^&.©^]/i, // Prefix characters to trigger commands
        phoneNumber: "", // Bot's phone number (not required if using QR code)
        thumbnail: "https://repository-images.githubusercontent.com/753096396/84e76ef0-ba19-4c87-8ec2-ea803b097479", // Bot's thumbnail image
        groupJid: "", // JID for the bot's group (not required if not using requireBotGroupMembership)
        newsletterJid: "120363416372653441@newsletter", // JID for the bot's channel

        // Bot session authentication configuration
        authAdapter: {
            adapter: "default", // Adapter for storing the session (Adapter options: default, mysql, mongo, firebase)

            // Default configuration
            default: {
                authDir: "state"
            },

            // MySQL configuration
            mysql: {
                host: "localhost:3306", // Hostname
                user: "root", // Username
                password: "admin123", // Password
                database: "whatsdex" // Database name
            },

            // MongoDB configuration
            mongodb: {
                url: "mongodb://localhost:27017/whatsdex" // URL
            },

            // Firebase configuration
            firebase: {
                tableName: "whatsdex", // Table name
                session: "state" // Session name
            }
        }
    },

    // Custom bot messages for specific situations
    msg: {
        admin: Formatter.quote("⛔ This command can only be accessed by group admins!"), // Message when a command is for admins only
        banned: Formatter.quote("⛔ Cannot process because you have been banned by the Owner!"), // Message for banned users
        botAdmin: Formatter.quote("⛔ Cannot process because the bot is not an admin in this group!"), // Message if the bot is not an admin in the group
        botGroupMembership: Formatter.quote(`⛔ Cannot process because you have not joined the bot's group!`), // Message if the user has not joined the bot's group
        coin: Formatter.quote("⛔ Cannot process because you don't have enough coins!"), // Message when coins are insufficient
        cooldown: Formatter.quote("🔄 This command is on cooldown, please wait..."), // Message during command cooldown
        gamerestrict: Formatter.quote("⛔ Cannot process because this group has restricted games!"), // Message if the group has restricted games
        group: Formatter.quote("⛔ This command can only be accessed within a group!"), // Message for group-only commands
        groupSewa: Formatter.quote(`⛔ The bot is inactive because this group has not been rented.`), // Message if the group has not been rented
        owner: Formatter.quote("⛔ This command can only be accessed by the Owner!"), // Message for owner-only commands
        premium: Formatter.quote("⛔ Cannot process because you are not a Premium user!"), // Message if the user is not Premium
        private: Formatter.quote("⛔ This command can only be accessed in a private chat!"), // Message for private chat-only commands
        privatePremiumOnly: Formatter.quote("⛔ Using the bot in a private chat is for Premium users only."), // Message if a non-Premium user uses the bot in a private chat
        restrict: Formatter.quote("⛔ This command has been restricted for security reasons!"), // Command restriction message
        unavailableAtNight: Formatter.quote("⛔ The bot is unavailable from 12 AM to 6 AM. Please come back later!"), // Message if unavailable at night

        readmore: "\u200E".repeat(4001), // Read more string
        note: "“Lorem ipsum dolor sit amet, in the shadow of darkness, life unto death.”", // Note
        footer: Formatter.italic("Developed by ItsReimau with ❤"), // Footer

        wait: Formatter.quote("🔄 Please wait a moment..."), // Loading message
        notFound: Formatter.quote("❎ Nothing found! Please try again later."), // Item not found message
        urlInvalid: Formatter.quote("❎ Invalid URL!") // Message if the URL is invalid
    },

    // Bot owner information
    owner: {
        name: "", // Bot owner's name
        organization: "", // Bot owner's organization name
        id: "", // Bot owner's phone number
        co: [""] // Co-owner's phone number
    },

    // Bot sticker
    sticker: {
        packname: "", // Sticker pack name
        author: "whatsdex <github.com/itsreimau/whatsdex>" // Sticker author
    },

    // API keys for various services
    api: {
        openai: "" // OpenAI API key
    },

    // Bot system
    system: {
        alwaysOnline: true, // Bot always has "online" status
        antiCall: true, // Bot automatically bans people who call
        autoRead: true, // Bot automatically reads messages
        autoMention: true, // Bot automatically mentions someone in sent messages
        autoAiLabel: true, // Bot automatically adds an AI label in sent messages
        autoTypingOnCmd: true, // Show "typing..." status when processing commands
        cooldown: 10 * 1000, // Cooldown between commands (ms)
        maxListeners: 50, // Max listeners for events
        port: 3000, // Port (if using a server)
        privatePremiumOnly: false, // Non-Premium users are not allowed to use the bot in private conversations
        restrict: false, // Restrict command access
        requireBotGroupMembership: false, // Must join the bot's group
        requireGroupSewa: false, // Must rent the bot to be used in a group
        reportErrorToOwner: true, // Report errors to the bot owner
        selfOwner: false, // Bot becomes its own owner
        selfReply: true, // Bot can reply to its own messages
        timeZone: "Asia/Jakarta", // Bot's time zone
        unavailableAtNight: false, // Bot is unavailable at night, from 12 AM to 6 AM (Time will be adjusted according to timeZone)
        useCoin: true, // Use coins
        usePairingCode: false, // Use pairing code for connection
        customPairingCode: "UMBR4L15", // Custom pairing code for connection (Optional, if using QR code, if empty the pairing code will be random)
        useStore: false, // Store for saving incoming messages
        useServer: false // Run the bot with a server
    }
};
// Import necessary modules and dependencies
import logger from '../utils/logger.js';

interface FormatterType {
  quote: (text: string) => string;
  italic: (text: string) => string;
  bold: (text: string) => string;
  monospace: (text: string) => string;
}

const Formatter: FormatterType = {
  quote: (text: string) => `_${text}_`,
  italic: (text: string) => `_${text}_`,
  bold: (text: string) => `*${text}*`,
  monospace: (text: string) => `\`\`${text}\`\``,
};

// Environment validation function
function validateEnvironment() {

}

// Run validation
validateEnvironment();

// Configuration
export default {
  // Basic bot information
  bot: {
    name: process.env.BOT_NAME || 'whatsdex', // Bot name
    prefix: new RegExp(process.env.BOT_PREFIX || '^[°•π÷×¶∆£¢€¥®™+✓_=|/~!?@#%^&.©^]'), // Prefix characters to trigger commands
    phoneNumber: process.env.BOT_PHONE_NUMBER || '', // REPLACE WITH YOUR BOT'S PHONE NUMBER
    thumbnail:
      'https://repository-images.githubusercontent.com/753096396/84e76ef0-ba19-4c87-8ec2-ea803b097479', // Bot's thumbnail image
    groupJid: process.env.GROUP_JID || '', // REPLACE WITH YOUR BOT'S GROUP JID
    newsletterJid: process.env.NEWSLETTER_JID || '120363416372653441@newsletter', // JID for the bot's channel
    browser: process.env.BOT_BROWSER ? JSON.parse(process.env.BOT_BROWSER as string) : ['WhatsDeX', 'Chrome', '1.0.0'], // Browser info

    // Bot session authentication configuration
    authAdapter: {
      adapter: process.env.AUTH_ADAPTER || 'default', // Adapter for storing the session (Adapter options: default, mysql, mongo, firebase)

      // Default configuration
      default: {
        authDir: 'state',
      },

      // MySQL configuration
      mysql: {
        host: process.env.MYSQL_HOST || 'localhost:3306', // Hostname
        user: process.env.MYSQL_USER || 'root', // Username
        password: process.env.MYSQL_PASSWORD || 'admin123', // Password
        database: process.env.MYSQL_DATABASE || 'whatsdex', // Database name
      },

      // MongoDB configuration
      mongodb: {
        url: process.env.MONGODB_URL || 'mongodb://localhost:27017/whatsdex', // URL
      },

      // Firebase configuration
      firebase: {
        tableName: process.env.FIREBASE_TABLE_NAME || 'whatsdex', // Table name
        session: process.env.FIREBASE_SESSION || 'state', // Session name
      },
    },
  },

  // Custom bot messages for specific situations
  msg: {
    admin: Formatter.quote('⛔ This command can only be accessed by group admins!'), // Message when a command is for admins only
    banned: Formatter.quote('⛔ Cannot process because you have been banned by the Owner!'), // Message for banned users
    botAdmin: Formatter.quote('⛔ Cannot process because the bot is not an admin in this group!'), // Message if the bot is not an admin in the group
    botGroupMembership: Formatter.quote(
      `⛔ Cannot process because you have not joined the bot's group!`
    ), // Message if the user has not joined the bot's group
    coin: Formatter.quote("⛔ Cannot process because you don't have enough coins!"), // Message when coins are insufficient
    cooldown: Formatter.quote('🔄 This command is on cooldown, please wait...'), // Message during command cooldown
    gamerestrict: Formatter.quote('⛔ Cannot process because this group has restricted games!'), // Message if the group has restricted games
    group: Formatter.quote('⛔ This command can only be accessed within a group!'), // Message for group-only commands
    groupSewa: Formatter.quote(`⛔ The bot is inactive because this group has not been rented.`), // Message if the group has not been rented
    owner: Formatter.quote('⛔ This command can only be accessed by the Owner!'), // Message for owner-only commands
    premium: Formatter.quote('⛔ Cannot process because you are not a Premium user!'), // Message if the user is not Premium
    private: Formatter.quote('⛔ This command can only be accessed in a private chat!'), // Message for private chat-only commands
    privatePremiumOnly: Formatter.quote(
      '⛔ Using the bot in a private chat is for Premium users only.'
    ), // Message if a non-Premium user uses the bot in a private chat
    restrict: Formatter.quote('⛔ This command has been restricted for security reasons!'), // Command restriction message
    unavailableAtNight: Formatter.quote(
      '⛔ The bot is unavailable from 12 AM to 6 AM. Please come back later!'
    ), // Message if unavailable at night

    readmore: '\u200E'.repeat(4001), // Read more string
    note: 'Welcome to WhatsDeX! Please replace this message with something relevant.', // Default note
    footer: Formatter.italic('Developed by CodeDeX with ❤'), // Footer

    wait: Formatter.quote('🔄 Please wait a moment...'), // Loading message
    notFound: Formatter.quote('❎ Nothing found! Please try again later.'), // Item not found message
    urlInvalid: Formatter.quote('❎ Invalid URL!'), // Message if the URL is invalid
  },

  // Bot sticker
  sticker: {
    packname: process.env.STICKER_PACKNAME || 'WhatsDeX Sticker Pack', // Sticker pack name
    author: process.env.STICKER_AUTHOR || 'CodeDeX', // Sticker author
  },

  // API keys for various services
  api: {
    gemini: process.env.GOOGLE_GEMINI_API_KEY || '', // REPLACE WITH YOUR GOOGLE GEMINI API KEY
  },

  // AI configuration
  ai: {
    summarization: {
      SUMMARIZE_THRESHOLD: 16,
      MESSAGES_TO_SUMMARIZE: 10,
      HISTORY_PRUNE_LENGTH: 6,
    },
    gemini: {
      model: process.env.GEMINI_MODEL || 'gemini-pro',
      generationConfig: {
        temperature: parseFloat(process.env.GEMINI_TEMP as string) || 0.7,
        topP: parseFloat(process.env.GEMINI_TOP_P as string) || 0.8,
        topK: parseInt(process.env.GEMINI_TOP_K as string, 10) || 40,
        maxOutputTokens: parseInt(process.env.GEMINI_MAX_TOKENS as string, 10) || 2048,
      }
    },
    memory: {
      maxSize: parseInt(process.env.AI_MEMORY_MAX_SIZE as string, 10) || 1000,
      ttl: parseInt(process.env.AI_MEMORY_TTL as string, 10) || 3600000,
      cleanupInterval: parseInt(process.env.AI_MEMORY_CLEANUP_INTERVAL as string, 10) || 300000,
    },
    intent: {
      aiKeywords: [
        'what', 'how', 'why', 'when', 'where', 'who',
        'explain', 'tell me', 'help', '?',
        'create', 'generate', 'write', 'make'
      ],
    },
  },

  // Redis configuration
  redis: (() => {
    // Prefer REDIS_URL if present
    try {
      if (process.env.REDIS_URL) {
        const u = new globalThis.URL(process.env.REDIS_URL);
        return {
          host: u.hostname || 'localhost',
          port: parseInt(u.port || '6379', 10),
          password: u.password || '',
        };
      }
    } catch { }
    return {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT as string, 10) || 6379,
      password: process.env.REDIS_PASSWORD || '',
    };
  })(),

  // Rate limit configuration
  rateLimits: {
    global: { requests: parseInt(process.env.RATE_LIMIT_GLOBAL_REQ as string) || 100, window: 60 },
    user: { requests: parseInt(process.env.RATE_LIMIT_USER_REQ as string) || 30, window: 60 },
    command: { requests: parseInt(process.env.RATE_LIMIT_CMD_REQ as string) || 10, window: 60 },
    ai: { requests: parseInt(process.env.RATE_LIMIT_AI_REQ as string) || 5, window: 300 },
    download: { requests: parseInt(process.env.RATE_LIMIT_DOWNLOAD_REQ as string) || 3, window: 60 },
    premium: { requests: parseInt(process.env.RATE_LIMIT_PREMIUM_REQ as string) || 100, window: 60 }
  },

  // Bot system
  system: {
    alwaysOnline: process.env.ALWAYS_ONLINE === 'true' || true, // Bot always has "online" status
    antiCall: process.env.ANTI_CALL === 'true' || true, // Bot automatically bans people who call
    autoRead: process.env.AUTO_READ === 'true' || true, // Bot automatically reads messages
    autoMention: process.env.AUTO_MENTION === 'true' || true, // Bot automatically mentions someone in sent messages
    autoAiLabel: process.env.AUTO_AI_LABEL === 'true' || true, // Bot automatically adds an AI label in sent messages
    autoTypingOnCmd: process.env.AUTO_TYPING__CMD === 'true' || true, // Show "typing..." status when processing commands
    cooldown: parseInt(process.env.BOT_COOLDOWN_MS as string, 10) || 10 * 1000, // Cooldown between commands (ms)
    maxListeners: parseInt(process.env.MAX_LISTENERS as string, 10) || 50, // Max listeners for events
    port: parseInt(process.env.PORT as string, 10) || 3001, // Port (if using a server)
    privatePremiumOnly: process.env.PRIVATE_PREMIUM_ONLY === 'true' || false, // Non-Premium users are not allowed to use the bot in private conversations
    restrict: process.env.RESTRICT_COMMANDS === 'true' || false, // Restrict command access
    requireBotGroupMembership: process.env.REQUIRE_BOT_GROUP_MEMBERSHIP === 'true' || false, // Must join the bot's group
    requireGroupSewa: process.env.REQUIRE_GROUP_SEWA === 'true' || false, // Must rent the bot to be used in a group
    reportErrorToOwner: process.env.REPORT_ERROR_TO_OWNER === 'true' || true, // Report errors to the bot owner
    selfOwner: process.env.SELF_OWNER === 'true' || false, // Bot becomes its own owner
    selfReply: process.env.SELF_REPLY === 'true' || true, // Bot can reply to its own messages
    timeZone: process.env.TIME_ZONE || 'Africa/Accra', // Bot's time zone
    unavailableAtNight: process.env.UNAVAILABLE_AT_NIGHT === 'true' || false, // Bot is unavailable at night, from 12 AM to 6 AM (Time will be adjusted according to timeZone)
    useCoin: process.env.USE_COIN === 'true' || true, // Use coins
    usePairingCode: process.env.USE_PAIRING_CODE === 'true' || false, // Use pairing code for connection
    customPairingCode: process.env.CUSTOM_PAIRING_CODE || 'UMBR4L15', // Custom pairing code for connection (Optional, if using QR code, if empty the pairing code will be random)
    useStore: process.env.USE_STORE === 'true' || false, // Store for saving incoming messages
    useServer: process.env.USE_SERVER === 'true' || false, // Run the bot with a server
  },

  // Connection configuration
  connection: {
    maxRetries: parseInt(process.env.CONN_MAX_RETRIES as string, 10) || 15,
    baseDelay: parseInt(process.env.CONN_BASE_DELAY as string, 10) || 3000,
    maxDelay: parseInt(process.env.CONN_MAX_DELAY as string, 10) || 300000,
    backoffMultiplier: parseFloat(process.env.CONN_BACKOFF_MULTIPLIER as string) || 1.5,
    circuitBreakerThreshold: parseInt(process.env.CONN_CB_THRESHOLD as string, 10) || 5,
    circuitBreakerTimeout: parseInt(process.env.CONN_CB_TIMEOUT as string, 10) || 600000,
  },
};

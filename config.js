// Import necessary modules and dependencies
const Formatter = {
  quote: text => `_${text}_`,
  italic: text => `_${text}_`,
  bold: text => `*${text}*`,
  monospace: text => `\`\`${text}\`\``,
};

// Environment validation function
function validateEnvironment() {
  const required = ['DATABASE_URL'];
  const missing = required.filter(env => !process.env[env]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    console.error('Please set these variables before starting the application.');
    process.exit(1);
  }
  
  // Validate DATABASE_URL format
  if (process.env.DATABASE_URL) {
    const dbUrlPattern = /^(postgresql|mysql|sqlite|mongodb):\/\//;
    if (!dbUrlPattern.test(process.env.DATABASE_URL)) {
      console.error('❌ DATABASE_URL format invalid. Must start with postgresql://, mysql://, sqlite://, or mongodb://');
      process.exit(1);
    }
  }
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
    browser: process.env.BOT_BROWSER ? JSON.parse(process.env.BOT_BROWSER) : ['WhatsDeX', 'Chrome', '1.0.0'], // Browser info

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

  // Bot owner information
  owner: {
    name: process.env.OWNER_NAME || 'Your Name', // REPLACE WITH YOUR NAME
    organization: process.env.OWNER_ORGANIZATION || 'Your Organization', // REPLACE WITH YOUR ORGANIZATION
    id: process.env.OWNER_NUMBER || '1234567890', // REPLACE WITH YOUR PHONE NUMBER
    co: process.env.CO_OWNER_NUMBERS ? process.env.CO_OWNER_NUMBERS.split(',') : [], // Co-owner's phone number
  },

  // Bot sticker
  sticker: {
    packname: process.env.STICKER_PACKNAME || 'WhatsDeX Sticker Pack', // Sticker pack name
    author: process.env.STICKER_AUTHOR || 'CodeDeX', // Sticker author
  },

  // API keys for various services
  api: {
    openai: process.env.OPENAI_API_KEY || '', // REPLACE WITH YOUR OPENAI API KEY
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
        temperature: parseFloat(process.env.GEMINI_TEMP) || 0.7,
        topP: parseFloat(process.env.GEMINI_TOP_P) || 0.8,
        topK: parseInt(process.env.GEMINI_TOP_K, 10) || 40,
        maxOutputTokens: parseInt(process.env.GEMINI_MAX_TOKENS, 10) || 2048,
      }
    }
  },

  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || '',
  },

  // Rate limit configuration
  rateLimits: {
    global: { requests: parseInt(process.env.RATE_LIMIT_GLOBAL_REQ) || 100, window: 60 },
    user: { requests: parseInt(process.env.RATE_LIMIT_USER_REQ) || 30, window: 60 },
    command: { requests: parseInt(process.env.RATE_LIMIT_CMD_REQ) || 10, window: 60 },
    ai: { requests: parseInt(process.env.RATE_LIMIT_AI_REQ) || 5, window: 300 },
    download: { requests: parseInt(process.env.RATE_LIMIT_DOWNLOAD_REQ) || 3, window: 60 },
    premium: { requests: parseInt(process.env.RATE_LIMIT_PREMIUM_REQ) || 100, window: 60 }
  },

  // Bot system
  system: {
    alwaysOnline: process.env.ALWAYS_ONLINE === 'true' || true, // Bot always has "online" status
    antiCall: process.env.ANTI_CALL === 'true' || true, // Bot automatically bans people who call
    autoRead: process.env.AUTO_READ === 'true' || true, // Bot automatically reads messages
    autoMention: process.env.AUTO_MENTION === 'true' || true, // Bot automatically mentions someone in sent messages
    autoAiLabel: process.env.AUTO_AI_LABEL === 'true' || true, // Bot automatically adds an AI label in sent messages
    autoTypingOnCmd: process.env.AUTO_TYPING__CMD === 'true' || true, // Show "typing..." status when processing commands
    cooldown: parseInt(process.env.BOT_COOLDOWN_MS, 10) || 10 * 1000, // Cooldown between commands (ms)
    maxListeners: parseInt(process.env.MAX_LISTENERS, 10) || 50, // Max listeners for events
    port: parseInt(process.env.PORT, 10) || 3001, // Port (if using a server)
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
};
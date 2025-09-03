// Enhanced context with audit logging and database services
const config = require("./config.js");
const pkg = require("./package.json");
const tools = require("./tools/exports.js");
const { Formatter } = require("@itsreimau/gktw");
const { Consolefy } = require("@mengkodingan/consolefy");
const path = require("node:path");
const SimplDB = require("simpl.db");
const fs = require("node:fs");
const AuditLogger = require("./src/services/auditLogger");
const DatabaseService = require("./src/services/database");

// Inisialisasi Consolefy untuk logging
const c = new Consolefy({
    tag: pkg.name
});

// Inisialisasi Database Service (Prisma)
const databaseService = new DatabaseService();

// Inisialisasi SimplDB untuk backward compatibility
const dbFile = path.resolve(__dirname, "database.json");
if (!fs.existsSync(dbFile)) fs.writeFileSync(dbFile, "{}", "utf8");

// Inisialisasi DAL (legacy)
const db = new SimplDB();
const database = {
    user: require("./database/user.js")(db),
    group: require("./database/group.js")(db),
    bot: require("./database/bot.js")(db),
    menfess: require("./database/menfess.js")(db)
};

const state = require("./state.js");

// Initialize audit logger with Prisma database service
const auditLogger = new AuditLogger(databaseService);

// Buat objek konteks
const context = {
    config,
    consolefy: c,
    db,
    database,
    databaseService,
    formatter: Formatter,
    state,
    tools,
    auditLogger,

    // Initialize services
    async initialize() {
        try {
            // Connect to database
            await databaseService.connect();

            // Initialize audit logger
            await auditLogger.initialize();

            console.log('All services initialized successfully');
        } catch (error) {
            console.error('Failed to initialize services:', error);
            throw error;
        }
    },

    // Graceful shutdown
    async shutdown() {
        try {
            await auditLogger.close();
            await databaseService.disconnect();
            console.log('All services shut down successfully');
        } catch (error) {
            console.error('Error during services shutdown:', error);
            throw error;
        }
    }
};

module.exports = context;
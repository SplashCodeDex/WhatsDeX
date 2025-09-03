// Enhanced context with audit logging
const config = require("./config.js");
const pkg = require("./package.json");
const tools = require("./tools/exports.js");
const { Formatter } = require("@itsreimau/gktw");
const { Consolefy } = require("@mengkodingan/consolefy");
const path = require("node:path");
const SimplDB = require("simpl.db");
const fs = require("node:fs");
const AuditLogger = require("./src/services/auditLogger");

// Inisialisasi Consolefy untuk logging
const c = new Consolefy({
    tag: pkg.name
});

// Inisialisasi SimplDB untuk Database
const dbFile = path.resolve(__dirname, "database.json");
if (!fs.existsSync(dbFile)) fs.writeFileSync(dbFile, "{}", "utf8");

// Inisialisasi DAL
const db = new SimplDB();
const database = {
    user: require("./database/user.js")(db),
    group: require("./database/group.js")(db),
    bot: require("./database/bot.js")(db),
    menfess: require("./database/menfess.js")(db)
};

const state = require("./state.js");

// Initialize audit logger
const auditLogger = new AuditLogger(database);

// Buat objek konteks
const context = {
    config,
    consolefy: c,
    db,
    database,
    formatter: Formatter,
    state,
    tools,
    auditLogger,

    // Initialize audit logger
    async initialize() {
        try {
            await auditLogger.initialize();
            console.log('Audit logger initialized successfully');
        } catch (error) {
            console.error('Failed to initialize audit logger:', error);
        }
    },

    // Graceful shutdown
    async shutdown() {
        try {
            await auditLogger.close();
            console.log('Audit logger shut down successfully');
        } catch (error) {
            console.error('Error during audit logger shutdown:', error);
        }
    }
};

module.exports = context;
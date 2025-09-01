// Impor modul dan dependensi yang diperlukan
const config = require("./config.js");
const pkg = require("./package.json");
const tools = require("./tools/exports.js");
const { Formatter } = require("@itsreimau/gktw");
const { Consolefy } = require("@mengkodingan/consolefy");
const path = require("node:path");
const SimplDB = require("simpl.db");
const fs = require("node:fs");

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

// Buat objek konteks
const context = {
    config,
    consolefy: c,
    db,
    database,
    formatter: Formatter,
    state,
    tools
};

module.exports = context;

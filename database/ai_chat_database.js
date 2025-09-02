const mongoose = require('mongoose');
const AIChat = require('./models/AIChat');
const path = require('path');
// Use a more robust path and handle missing config for tests
let config;
try {
    config = require(path.join(__dirname, '../config.js'));
} catch (e) {
    config = require(path.join(__dirname, '../config.example.js'));
}

let isConnected = false;

async function connect() {
    if (isConnected) return;
    try {
        await mongoose.connect(config.database.mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        isConnected = true;
        console.log('Successfully connected to AI Chat MongoDB.');
    } catch (error) {
        console.error('Error connecting to AI Chat MongoDB:', error);
        // Do not exit process, as the main bot might still function
    }
}

// Ensure connection is established before any operation
const ensureConnected = async () => {
    if (!isConnected) {
        await connect();
    }
};

module.exports = {
    async getChat(userId) {
        await ensureConnected();
        return await AIChat.findOne({ userId }).lean();
    },

    async updateChat(userId, updates) {
        await ensureConnected();
        // Use upsert to create the document if it doesn't exist
        return await AIChat.updateOne({ userId }, { $set: updates }, { upsert: true });
    }
};

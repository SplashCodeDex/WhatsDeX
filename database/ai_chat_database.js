const mongoose = require('mongoose');
const AIChat = require('./models/AIChat');
const path = require('path');
const logger = require('../src/utils/logger');
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

    const MAX_RETRIES = 3;
    const RETRY_DELAY = 5000;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            await mongoose.connect(config.database.mongoUri, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });
            isConnected = true;
            logger.info('Successfully connected to AI Chat MongoDB', { attempt });
            return;
        } catch (error) {
            logger.error('Error connecting to AI Chat MongoDB', {
                attempt,
                maxRetries: MAX_RETRIES,
                error: error.message
            });

            if (attempt === MAX_RETRIES) {
                throw new Error(`Failed to connect to MongoDB after ${MAX_RETRIES} attempts: ${error.message}`);
            }

            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
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

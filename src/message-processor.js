const path = require('path');
const fs = require('fs');
const util = require('util');
const context = require('../context'); // Import the context module

// Load all commands dynamically
const commands = new Map();
const commandsDir = path.join(__dirname, '..', 'commands');

function loadCommands(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
            loadCommands(fullPath); // Recursively load commands from subdirectories
        } else if (file.isFile() && file.name.endsWith('.js')) {
            try {
                const command = require(fullPath);
                if (command.name && typeof command.code === 'function') {
                    commands.set(command.name, command);
                    console.log(`Loaded command: ${command.name}`);
                }
            } catch (error) {
                console.error(`Error loading command ${fullPath}:`, error);
            }
        }
    }
}

loadCommands(commandsDir);

module.exports = async (job) => {
    console.log('message-processor: Received job', job.data.serializableMsg.key.id);
    const { serializableMsg: msg } = job.data;
    const bot = global.bot; // Assume bot is set globally in main.js

    if (!bot) {
        console.error('Bot object is not available in message-processor.');
        return;
    }

    const { config, formatter, database, tools } = context;

    const messageType = msg.type || Object.keys(msg.message || {})[0];
    let text = '';

    if (messageType === 'conversation') {
        text = msg.message.conversation;
    } else if (messageType === 'extendedTextMessage' && msg.message.extendedTextMessage) {
        text = msg.message.extendedTextMessage.text;
    }
    console.log('message-processor: Extracted text:', text);

    if (!text) return;

    const prefixMatch = text.match(config.bot.prefix);
    console.log('message-processor: Prefix match:', prefixMatch);

    if (!prefixMatch) return; // Not a command

    const prefix = prefixMatch[0];
    const commandText = text.substring(prefix.length).trim();
    const args = commandText.split(' ');
    const commandName = args.shift().toLowerCase();

    console.log('message-processor: Command name:', commandName);
    console.log('message-processor: Arguments:', args);

    const command = commands.get(commandName);
    console.log('message-processor: Found command:', !!command);
    if (commandName === 'proverb') console.log('Proverb command matched');

    if (command) {
        const ctx = {
            reply: async (content) => {
                await bot.sendMessage(msg.key.remoteJid, { text: content });
            },
            editMessage: async (key, content) => {
                await bot.sendMessage(msg.key.remoteJid, { edit: key, text: content });
            },
            bot: {
                context: {
                    config,
                    formatter,
                    database,
                    tools,
                },
            },
            used: {
                prefix: prefix,
                command: commandName,
            },
            args: args,
            sender: {
                jid: msg.key.participant || msg.key.remoteJid, // For group messages, participant is sender, else remoteJid
                pushName: msg.pushName,
            },
            id: msg.key.id,
            isGroup: msg.key.remoteJid.endsWith('@g.us'),
            // Placeholder for group functions - these would need actual implementation
            // that interacts with Baileys' group metadata and participants.
            // For now, they return false or throw an error.
            group: () => ({
                isAdmin: async (jid) => {
                    console.warn('group.isAdmin not fully implemented in message-processor.js');
                    // You would need to fetch group metadata and check participant roles here
                    return false;
                },
                isOwner: async (jid) => {
                    console.warn('group.isOwner not fully implemented in message-processor.js');
                    // You would need to fetch group metadata and check participant roles here
                    return false;
                },
                // Add other group-related functions as needed by commands
            }),
            // Add other properties to ctx as needed by commands (e.g., quoted message, media)
            msg: msg, // The original serializable message
            // Helper to get ID from JID (e.g., 62812...)
            getId: (jid) => jid.split('@')[0],
        };

        try {
            console.log('message-processor: Executing command:', commandName);
            await command.code(ctx);
            console.log('message-processor: Command executed successfully:', commandName);
        } catch (error) {
            console.error(`Error executing command ${commandName}:`, error);
            await ctx.reply(formatter.quote(`An error occurred while executing ${prefix}${commandName}: ${error.message}`));
        }
    } else {
        console.log(`message-processor: Unknown command: ${commandName}`);
        // Optional: Handle unknown commands
        // await bot.sendMessage(msg.key.remoteJid, { text: formatter.quote(`Unknown command: ${prefix}${commandName}`) });
    }
};

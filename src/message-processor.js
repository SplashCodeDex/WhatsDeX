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
    } else if (messageType === 'imageMessage' && msg.message.imageMessage && msg.message.imageMessage.caption) {
        text = msg.message.imageMessage.caption;
    } else if (messageType === 'videoMessage' && msg.message.videoMessage && msg.message.videoMessage.caption) {
        text = msg.message.videoMessage.caption;
    } else if (messageType === 'buttonsMessage' && msg.message.buttonsMessage && msg.message.buttonsMessage.footer) {
        text = msg.message.buttonsMessage.footer;
    } else if (messageType === 'protocolMessage' && msg.message.protocolMessage && msg.message.protocolMessage.quotedMessage) {
        // Handle reaction or other protocol, but for now, extract from quoted if text
        const quoted = msg.message.protocolMessage.quotedMessage;
        const quotedType = Object.keys(quoted)[0];
        if (quotedType === 'conversation') {
            text = quoted.conversation;
        } else if (quotedType === 'extendedTextMessage') {
            text = quoted.extendedTextMessage.text;
        }
    }
    console.log('message-processor: Extracted text:', text);

    // Early skip for non-text types to reduce noise
    const textTypes = ['conversation', 'extendedTextMessage', 'imageMessage', 'videoMessage', 'buttonsMessage', 'protocolMessage'];
    if (!textTypes.includes(messageType)) {
        console.log('message-processor: Skipping non-text message type:', messageType);
        return;
    }
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
                const messageContent = typeof content === 'string' ? { text: content } : content;
                return await bot.sendMessage(msg.key.remoteJid, messageContent);
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
                    if (!msg.key.remoteJid.endsWith('@g.us')) return false;
                    try {
                        const metadata = await bot.groupMetadata(msg.key.remoteJid);
                        const participant = metadata.participants.find(p => p.id === jid);
                        return participant ? participant.admin : false;
                    } catch (error) {
                        console.error('Error fetching group metadata for isAdmin:', error);
                        return false;
                    }
                },
                isOwner: async (jid) => {
                    if (!msg.key.remoteJid.endsWith('@g.us')) return false;
                    try {
                        const metadata = await bot.groupMetadata(msg.key.remoteJid);
                        return metadata.owner === jid;
                    } catch (error) {
                        console.error('Error fetching group metadata for isOwner:', error);
                        return false;
                    }
                },
                // Add other group-related functions as needed by commands
            }),
            // Add other properties to ctx as needed by commands (e.g., quoted message, media)
            msg: msg, // The original serializable message
            // Helper to get ID from JID (e.g., 62812...)
            getId: (jid) => jid.split('@')[0],
        };

        // Integrate middleware chain
        try {
            const middleware = [
                require('../middleware/botMode.js'),
                require('../middleware/inputValidation.js'),
                require('../middleware/groupMute.js'),
                require('../middleware/nightMode.js'),
                require('../middleware/maliciousMessage.js'),
                require('../middleware/didYouMean.js'),
                require('../middleware/afk.js'),
                require('../middleware/antiMedia.js'),
                require('../middleware/antiLink.js'),
                require('../middleware/antiNsfw.js'),
                require('../middleware/antiSpam.js'),
                require('../middleware/antiTagsw.js'),
                require('../middleware/antiToxic.js'),
                require('../middleware/menfess.js'),
                require('../middleware/rateLimiter.js')
            ];

            for (const mw of middleware) {
                const result = await mw(ctx, context);
                if (!result) {
                    console.log('message-processor: Middleware blocked command:', commandName);
                    return; // Middleware blocked, exit
                }
            }
        } catch (mwError) {
            console.error('Middleware error in processor:', mwError);
            await ctx.reply(formatter.quote(`Middleware error: ${mwError.message}`));
            return;
        }

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

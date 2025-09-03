// Import required modules and dependencies
const {
    Cooldown
} = require("@itsreimau/gktw");
const moment = require("moment-timezone");

// Import enhanced services
const ContentModerationService = require("./src/services/contentModeration");
const NLPProcessorService = require("./src/services/nlpProcessor");
const logger = require("./src/utils/logger");

// Initialize services
const moderationService = new ContentModerationService();
const nlpService = new NLPProcessorService();

// Function to check user coins
async function checkCoin(database, requiredCoin, userDb, senderId, isOwner) {
    if (isOwner || userDb?.premium) return false;
    if (userDb?.coin < requiredCoin) return true;
    await database.user.update(senderId, { coin: userDb.coin - requiredCoin });
    return false;
}

// Main bot middleware
module.exports = (bot, context) => {
    const { database, consolefy, tools: { cmd }, config, formatter } = context;

    bot.use(async (ctx, next) => {
        // Common variables
        const isGroup = ctx.isGroup();
        const isPrivate = !isGroup;
        const senderJid = ctx.sender.jid;
        const senderId = ctx.getId(senderJid);
        const groupJid = isGroup ? ctx.id : null;
        const groupId = isGroup ? ctx.getId(groupJid) : null;
        const isOwner = cmd.isOwner(config, senderId, ctx.msg.key.id);
        const isAdmin = isGroup ? await ctx.group().isAdmin(senderJid) : false;

        // Get database
        const userDb = await database.user.get(senderId);
        const groupDb = isGroup ? await database.group.get(groupId) : {};

        // Content Moderation Check
        if (!ctx.msg.key.fromMe && ctx.msg.message) {
            try {
                const messageContent = ctx.getMessage();

                if (messageContent && messageContent.trim().length > 0) {
                    const moderationResult = await moderationService.moderateContent(messageContent, {
                        userId: senderId,
                        groupId: groupId,
                        isGroup,
                        isOwner,
                        isAdmin
                    });

                    if (!moderationResult.safe) {
                        logger.warn('Message blocked by content moderation', {
                            userId: senderId,
                            groupId: groupId,
                            categories: moderationResult.categories,
                            score: moderationResult.score
                        });

                        // Block the message
                        const blockMessage = config.msg?.contentModeration ||
                            '🚫 Your message has been blocked due to content policy violations.';

                        await ctx.reply({
                            text: formatter.quote(blockMessage),
                            footer: config.msg.footer
                        });

                        // Don't process the command
                        return;
                    }
                }
            } catch (error) {
                logger.error('Content moderation check failed', {
                    error: error.message,
                    userId: senderId
                });
                // Continue processing if moderation fails
            }
        }

        // Natural Language Processing for Command Suggestions
        if (!ctx.msg.key.fromMe && ctx.msg.message && !ctx.used.command) {
            try {
                const messageContent = ctx.getMessage();

                if (messageContent && messageContent.trim().length > 3) {
                    // Get user's recent commands for context
                    const recentCommands = userDb?.recentCommands || [];

                    // Process with NLP
                    const nlpResult = await nlpService.processInput(messageContent, {
                        userId: senderId,
                        recentCommands: recentCommands,
                        isGroup,
                        isAdmin,
                        isOwner
                    });

                    // If high confidence and no explicit command, suggest one
                    if (nlpResult.confidence > 0.7 && nlpResult.command) {
                        logger.debug('NLP command suggestion triggered', {
                            userId: senderId,
                            intent: nlpResult.intent,
                            command: nlpResult.command,
                            confidence: nlpResult.confidence
                        });

                        const suggestionMessage = `🤖 **I think you might want to use:** ${ctx.used.prefix}${nlpResult.command}\n\n` +
                            `💡 *Confidence: ${Math.round(nlpResult.confidence * 100)}%*\n` +
                            `📝 *Reason: ${nlpResult.explanation}*\n\n` +
                            `💭 *If this is correct, reply with just "${nlpResult.command}" to use it, or describe what you actually want!*`;

                        await ctx.reply({
                            text: suggestionMessage,
                            footer: config.msg.footer
                        });

                        // Store the suggestion for potential use
                        ctx.nlpSuggestion = nlpResult;
                    }
                }
            } catch (error) {
                logger.error('NLP processing failed in middleware', {
                    error: error.message,
                    userId: senderId
                });
                // Continue processing if NLP fails
            }
        }

        // Log incoming command
        if (isGroup && !ctx.msg.key.fromMe) {
            consolefy.info(`Incoming command: ${ctx.used.command}, from group: ${groupId}, by: ${senderId}`);
        } else if (isPrivate && !ctx.msg.key.fromMe) {
            consolefy.info(`Incoming command: ${ctx.used.command}, from: ${senderId}`);
        }

        // Add user XP and handle level-ups
        const xpGain = 10;
        const xpToLevelUp = 100;
        let newUserXp = (userDb?.xp || 0) + xpGain;
        if (newUserXp >= xpToLevelUp) {
            let newUserLevel = (userDb?.level || 0) + 1;
            newUserXp -= xpToLevelUp;

            if (userDb?.autolevelup) {
                const profilePictureUrl = await ctx.core.profilePictureUrl(ctx.sender.jid, "image").catch(() => "https://i.pinimg.com/736x/70/dd/61/70dd612c65034b88ebf474a52ccc70c4.jpg");
                await ctx.reply({
                    text: formatter.quote(` Congratulations! You have leveled up to level ${newUserLevel}.`),
                    footer: config.msg.footer,
                    buttons: [{
                        buttonId: `${ctx.used.prefix}setprofile autolevelup`,
                        buttonText: {
                            displayText: "Disable Autolevelup"
                        }
                    }]
                });
            }

            await database.user.update(senderId, { xp: newUserXp, level: newUserLevel });
        } else {
            await database.user.update(senderId, { xp: newUserXp });
        }

        // Simulate typing
        const simulateTyping = () => {
            if (config.system.autoTypingOnCmd) ctx.simulateTyping();
        };

        // Check restriction conditions
        const restrictions = [{
            key: "banned",
            condition: userDb?.banned && ctx.used.command !== "owner",
            msg: config.msg.banned,
            buttons: [{
                buttonId: `${ctx.used.prefix}owner`,
                buttonText: {
                    displayText: "Contact Owner"
                }
            }],
            reaction: "🚫"
        }, {
            key: "cooldown",
            condition: new Cooldown(ctx, config.system.cooldown).onCooldown && !isOwner && !userDb?.premium,
            msg: config.msg.cooldown,
            reaction: "💤"
        }, {
            key: "gamerestrict",
            condition: groupDb?.option?.gamerestrict && isGroup && !isAdmin && ctx.bot.cmd.get(ctx.used.command).category === "game",
            msg: config.msg.gamerestrict,
            reaction: "🎮"
        }, {
            key: "privatePremiumOnly",
            condition: config.system.privatePremiumOnly && isPrivate && !isOwner && !userDb?.premium && !["price", "owner"].includes(ctx.used.command),
            msg: config.msg.privatePremiumOnly,
            buttons: [{
                buttonId: `${ctx.used.prefix}price`,
                buttonText: {
                    displayText: "Premium Price"
                }
            }, {
                buttonId: `${ctx.used.prefix}owner`,
                buttonText: {
                    displayText: "Contact Owner"
                }
            }],
            reaction: "💎"
        }, {
            key: "requireBotGroupMembership",
            condition: config.system.requireBotGroupMembership && !isOwner && !userDb?.premium && ctx.used.command !== "botgroup" && config.bot.groupJid && !(await ctx.group(config.bot.groupJid).members()).some(member => member.jid === senderJid),
            msg: config.msg.botGroupMembership,
            buttons: [{
                buttonId: `${ctx.used.prefix}botgroup`,
                buttonText: {
                    displayText: "Bot Group"
                }
            }],
            reaction: "🚫"
        }, {
            key: "requireGroupSewa",
            condition: config.system.requireGroupSewa && isGroup && !isOwner && !["price", "owner"].includes(ctx.used.command) && groupDb?.sewa !== true,
            msg: config.msg.groupSewa,
            buttons: [{
                buttonId: `${ctx.used.prefix}price`,
                buttonText: {
                    displayText: "Rental Price"
                }
            }, {
                buttonId: `${ctx.used.prefix}owner`,
                buttonText: {
                    displayText: "Contact Owner"
                }
            }],
            reaction: "🔒"
        }, {
            key: "unavailableAtNight",
            condition: (() => {
                const now = moment().tz(config.system.timeZone);
                const hour = now.hour();
                return config.system.unavailableAtNight && !isOwner && !userDb?.premium && hour >= 0 && hour < 6;
            })(),
            msg: config.msg.unavailableAtNight,
            reaction: "😴"
        }];

        for (const {
                condition,
                msg,
                reaction,
                key,
                buttons
            }
            of restrictions) {
            if (condition) {
                const now = Date.now();
                const lastSentMsg = userDb?.lastSentMsg?.[key] || 0;
                const oneDay = 24 * 60 * 60 * 1000;
                if (!lastSentMsg || (now - lastSentMsg) > oneDay) {
                    simulateTyping();
                    await database.user.update(senderId, { lastSentMsg: { ...userDb.lastSentMsg, [key]: now } });
                    return await ctx.reply({
                        text: msg,
                        footer: formatter.italic(`The next response will be an emoji reaction ${formatter.inlineCode(reaction)}.`),
                        buttons: buttons || null
                    });
                } else {
                    return await ctx.replyReact(reaction);
                }
            }
        }

        // Check permission conditions
        const command = [...ctx.bot.cmd.values()].find(cmd => [cmd.name, ...(cmd.aliases || [])].includes(ctx.used.command));
        if (!command) return await next();
        const {
            permissions = {}
        } = command;
        const permissionChecks = [{
            key: "admin",
            condition: isGroup && !isAdmin,
            msg: config.msg.admin,
            reaction: "🛡️"
        }, {
            key: "botAdmin",
            condition: isGroup && !await ctx.group().isBotAdmin(),
            msg: config.msg.botAdmin,
            reaction: "🤖"
        }, {
            key: "coin",
            condition: permissions.coin && config.system.useCoin && await checkCoin(database, permissions.coin, userDb, senderId, isOwner),
            msg: config.msg.coin,
            buttons: [{
                buttonId: `${ctx.used.prefix}coin`,
                buttonText: {
                    displayText: "Check Coins"
                }
            }],
            reaction: "💰"
        }, {
            key: "group",
            condition: isPrivate,
            msg: config.msg.group,
            reaction: "👥"
        }, {
            key: "owner",
            condition: !isOwner,
            msg: config.msg.owner,
            reaction: "👑"
        }, {
            key: "premium",
            condition: !isOwner && !userDb?.premium,
            msg: config.msg.premium,
            buttons: [{
                buttonId: `${ctx.used.prefix}price`,
                buttonText: {
                    displayText: "Premium Price"
                }
            }, {
                buttonId: `${ctx.used.prefix}owner`,
                buttonText: {
                    displayText: "Contact Owner"
                }
            }],
            reaction: "💎"
        }, {
            key: "private",
            condition: isGroup,
            msg: config.msg.private,
            reaction: "📩"
        }, {
            key: "restrict",
            condition: config.system.restrict,
            msg: config.msg.restrict,
            reaction: "🚫"
        }];

        for (const {
                key,
                condition,
                msg,
                reaction,
                buttons
            }
            of permissionChecks) {
            if (permissions[key] && condition) {
                const now = Date.now();
                const lastSentMsg = userDb?.lastSentMsg?.[key] || 0;
                const oneDay = 24 * 60 * 60 * 1000;
                if (!lastSentMsg || (now - lastSentMsg) > oneDay) {
                    simulateTyping();
                    await database.user.update(senderId, { lastSentMsg: { ...userDb.lastSentMsg, [key]: now } });
                    return await ctx.reply({
                        text: msg,
                        footer: formatter.italic(`The next response will be an emoji reaction ${formatter.inlineCode(reaction)}.`),
                        buttons: buttons || null
                    });
                } else {
                    return await ctx.replyReact(reaction);
                }
            }
        }

        simulateTyping();
        await next(); // Continue to the next process
    });
};
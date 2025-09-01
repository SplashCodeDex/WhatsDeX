// Impor modul dan dependensi yang diperlukan
const {
    Baileys,
    Events,
    VCardBuilder
} = require("@itsreimau/gktw");
const axios = require("axios");
const {
    analyzeMessage
} = require("guaranteed_security");
const moment = require("moment-timezone");
const fs = require("node:fs");

// Fungsi untuk menangani event pengguna bergabung/keluar grup
async function handleWelcome(bot, m, type, isSimulate = false) {
    const { config, database, formatter, tools: { cmd } } = context;
    const groupJid = m.id;
    const groupId = bot.getId(m.id);
    const groupDb = await database.group.get(groupId);
    const botDb = await database.bot.get();

    if (!isSimulate && groupDb?.mutebot) return;
    if (!isSimulate && !groupDb?.option?.welcome) return;
    if (!isSimulate && ["private", "self"].includes(botDb?.mode)) return;
    const now = moment().tz(config.system.timeZone);
    const hour = now.hour();
    if (!isSimulate && hour >= 0 && hour < 6) return;

    for (const jid of m.participants) {
        const isWelcome = type === Events.UserJoin;
        const userTag = `@${bot.getId(jid)}`;
        const customText = isWelcome ? groupDb?.text?.welcome : groupDb?.text?.goodbye;
        const metadata = await bot.core.groupMetadata(groupJid);
        const text = customText ?
            customText
            .replace(/%tag%/g, userTag)
            .replace(/%subject%/g, metadata.subject)
            .replace(/%description%/g, metadata.description) :
            (isWelcome ?
                formatter.quote(` Welcome ${userTag} to the group ${metadata.subject}!`) :
                formatter.quote(` Goodbye, ${userTag}!`));
        const profilePictureUrl = await bot.core.profilePictureUrl(jid, "image").catch(() => "https://i.pinimg.com/736x/70/dd/61/70dd612c65034b88ebf474a52ccc70c4.jpg");

        await bot.core.sendMessage(groupJid, {
            text,
            mentions: [jid],
            contextInfo: {
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: config.bot.newsletterJid,
                    newsletterName: config.bot.name
                },
                externalAdReply: {
                    title: config.bot.name,
                    body: `v${require("../package.json").version}`,
                    mediaType: 1,
                    thumbnailUrl: profilePictureUrl,
                    sourceUrl: config.bot.groupLink
                }
            }
        }, {
            quoted: tools.cmd.fakeMetaAiQuotedText(config.msg.footer)
        });

        if (isWelcome && groupDb?.text?.intro) await bot.core.sendMessage(groupJid, {
            text: groupDb.text.intro,
            mentions: [jid]
        }, {
            quoted: tools.cmd.fakeMetaAiQuotedText("Don't forget to fill out your intro!")
        });
    }
}


// Events utama bot
module.exports = (bot, context) => {
    const { config, consolefy, db, formatter, tools: { cmd, msg } } = context;

    bot.ev.setMaxListeners(config.system.maxListeners); // Tetapkan max listeners untuk events

    // Event saat bot siap
    bot.ev.once(Events.ClientReady, async (m) => {
        const { database } = context;
        consolefy.success(`${config.bot.name} by ${config.owner.name}, ready at ${m.user.id}`);

        // Mulai ulang bot
        const botRestart = await database.bot.get("restart");
        if (botRestart?.jid && botRestart?.timestamp) {
            const timeago = msg.convertMsToDuration(Date.now() - botRestart.timestamp);
            await bot.core.sendMessage(botRestart.jid, {
                text: formatter.quote(`[OK] Successfully restarted! It took ${timeago}.`),
                edit: botRestart.key
            });
            await database.bot.update({ restart: null });
        }

        // Tetapkan config pada bot
        config.bot = {
            ...config.bot,
            jid: m.user.id,
            decodedJid: bot.decodeJid(m.user.id),
            id: bot.getId(m.user.id),
            readyAt: bot.readyAt,
            groupLink: await bot.core.groupInviteCode(config.bot.groupJid).then(code => `https://chat.whatsapp.com/${code}`).catch(() => "https://chat.whatsapp.com/FxEYZl2UyzAEI2yhaH34Ye")
        };
    });

    // Event saat bot menerima pesan
    bot.ev.on(Events.MessagesUpsert, async (m, ctx) => {
        const { config, database, consolefy, formatter, tools: { cmd, msg } } = context;

        // Tambahkan data db ke ctx
        ctx.userDb = await database.user.get(ctx.sender.id);
        ctx.groupDb = ctx.isGroup() ? await database.group.get(ctx.id) : {};

        // Jalankan middleware
        const messageMiddleware = [
            require("../middleware/botMode.js"),
            require("../middleware/groupMute.js"),
            require("../middleware/nightMode.js"),
            require("../middleware/maliciousMessage.js"),
            require("../middleware/didYouMean.js"),
            require("../middleware/afk.js"),
            require("../middleware/antiMedia.js"),
            require("../middleware/antiLink.js"),
            require("../middleware/antiNsfw.js"),
            require("../middleware/antiSpam.js"),
            require("../middleware/antiTagsw.js"),
            require("../middleware/antiToxic.js"),
            require("../middleware/menfess.js")
        ];

        for (const middleware of messageMiddleware) {
            const result = await middleware(ctx, context);
            if (!result) return;
        }

        // Variabel umum
        const isGroup = ctx.isGroup();
        const isPrivate = !isGroup;
        const senderJid = ctx.sender.jid;
        const senderId = ctx.getId(senderJid);
        const groupJid = isGroup ? ctx.id : null;
        const groupId = isGroup ? ctx.getId(groupJid) : null;
        const isOwner = cmd.isOwner(config, senderId, m.key.id);
        const isCmd = cmd.isCmd(config, m.content, ctx.bot);
        const isAdmin = isGroup ? await ctx.group().isAdmin(senderJid) : false;

        // Mengambil database
        const botDb = await database.bot.get();
        const userDb = ctx.userDb;
        const groupDb = ctx.groupDb;

        // Grup atau Pribadi
        if (isGroup || isPrivate) {
            if (m.key.fromMe) return;

            const { state } = context;
            state.uptime = msg.convertMsToDuration(Date.now() - config.bot.readyAt);
            state.dbSize = fs.existsSync("database.json") ? msg.formatSize(fs.statSync("database.json").size / 1024) : "N/A";

            // Penanganan database pengguna
            if (!userDb?.username) await database.user.update(senderId, { username: `@user_${cmd.generateUID(config, senderId, false)}` });
            if (!userDb?.uid || userDb?.uid !== cmd.generateUID(config, senderId)) await database.user.update(senderId, { uid: cmd.generateUID(config, senderId) });
            if (userDb?.premium && Date.now() > userDb.premiumExpiration) {
                const { premium, premiumExpiration, ...rest } = userDb;
                await database.user.set(senderId, rest);
            }
            if (isOwner || userDb?.premium) await database.user.update(senderId, { coin: 0 });
            if (!userDb?.coin || !Number.isFinite(userDb.coin)) await database.user.update(senderId, { coin: 500 });
        }

        // Penanganan obrolan grup
        if (isGroup) {
            if (m.key.fromMe) return;

            if (!isCmd || isCmd?.didyoumean) consolefy.info(`Incoming message from group: ${groupId}, by: ${senderId}`); // Log pesan masuk

            // Variabel umum
            const groupAutokick = groupDb?.option?.autokick;

            // Penanganan database grup
            if (groupDb?.sewa && Date.now() > userDb?.sewaExpiration) {
                await db.delete(`group.${groupId}.sewa`);
                await db.delete(`group.${groupId}.sewaExpiration`);
            }

        }

        // Penanganan obrolan pribadi
        if (isPrivate) {
            if (m.key.fromMe) return;

            if (!isCmd || isCmd?.didyoumean) consolefy.info(`Incoming message from: ${senderId}`); // Log pesan masuk
        }
    });

    // Event saat bot menerima panggilan
    bot.ev.on(Events.Call, async (calls) => {
        const { config, database, consolefy, formatter, tools: { cmd } } = context;
        if (!config.system.antiCall) return;

        for (const call of calls) {
            consolefy.info(`Incoming call from: ${bot.getId(call.from)}`); // Log panggilan masuk

            if (call.status !== "offer") continue;

            await bot.core.rejectCall(call.id, call.from);
            await database.user.update(bot.getId(call.from), { banned: true });

            await bot.core.sendMessage(config.owner.id + Baileys.S_WHATSAPP_NET, {
                text: ` Account @${bot.getId(call.from)} has been automatically blocked for the reason ${formatter.inlineCode("Anti Call")}.`,
                mentions: [call.from]
            });

            const vcard = new VCardBuilder()
                .setFullName(config.owner.name)
                .setOrg(config.owner.organization)
                .setNumber(config.owner.id)
                .build();
            await bot.core.sendMessage(call.from, {
                contacts: {
                    displayName: config.owner.name,
                    contacts: [{
                        vcard
                    }]
                }
            }, {
                quoted: cmd.fakeMetaAiQuotedText(`The bot cannot receive ${call.isVideo ? "video" : "voice"} calls! If you need help, please contact the Owner.`)
            });
        }
    });

    // Event saat pengguna bergabung atau keluar dari grup
    bot.ev.on(Events.UserJoin, async (m) => handleWelcome(bot, m, Events.UserJoin));
    bot.ev.on(Events.UserLeave, async (m) => handleWelcome(bot, m, Events.UserLeave));
};
module.exports.handleWelcome = handleWelcome; // Penanganan event pengguna bergabung/keluar grup
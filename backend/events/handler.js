// Impor modul dan dependensi yang diperlukan
import VCard from 'vcard-creator';
import axios from 'axios';
import {
  jidDecode,
  getContentType,
  downloadContentFromMessage,
} from '@whiskeysockets/baileys'; // Removed missing dependency
import moment from 'moment-timezone';
import fs from 'node:fs';
import { createRequire } from 'module';

// Import middleware
import afkMiddleware from '../middleware/afk.js';
import analyticsMiddleware from '../middleware/analytics.js';
import antiLinkMiddleware from '../middleware/antiLink.js';
import antiMediaMiddleware from '../middleware/antiMedia.js';
import antiNsfwMiddleware from '../middleware/antiNsfw.js';
import antiSpamMiddleware from '../middleware/antiSpam.js';
import antiTagswMiddleware from '../middleware/antiTagsw.js';
import antiToxicMiddleware from '../middleware/antiToxic.js';
import auditFixedMiddleware from '../middleware/audit-fixed.js';
import auditMiddleware from '../middleware/audit.js';
// import authMiddleware from '../middleware/auth.js'; // Removed incompatible middleware
import botModeMiddleware from '../middleware/botMode.js';
import cooldownMiddleware from '../middleware/cooldown.js';
import didYouMeanMiddleware from '../middleware/didYouMean.js';
// import errorHandlerMiddleware from '../middleware/errorHandler.js'; // Removed incompatible middleware
import groupMuteMiddleware from '../middleware/groupMute.js';
import inputValidationMiddleware from '../middleware/inputValidation.js';
import maliciousMessageMiddleware from '../middleware/maliciousMessage.js';
import menfessMiddleware from '../middleware/menfess.js';
import nightModeMiddleware from '../middleware/nightMode.js';
import rateLimiterMiddleware from '../middleware/rateLimiter.js';

const require = createRequire(import.meta.url);

// Fungsi untuk menangani event pengguna bergabung/keluar grup
export async function handleWelcome(bot, m, type, isSimulate = false) {
  const {
    config,
    database,
    formatter,
    tools: { cmd },
  } = bot.context;
  const groupJid = m.id;
  const groupId = bot.getId(m.id);
  const groupDb = await database.group.get(groupId);
  const botDb = await database.bot.get();

  if (!isSimulate && groupDb?.mutebot) return;
  if (!isSimulate && !groupDb?.option?.welcome) return;
  if (!isSimulate && ['private', 'self'].includes(botDb?.mode)) return;
  const now = moment().tz(config.system.timeZone);
  const hour = now.hour();
  if (!isSimulate && hour >= 0 && hour < 6) return;

  for (const jid of m.participants) {
    const isWelcome = type === 'add';
    const userTag = '@' + jid.split('@')[0] + ' ';
    const customText = isWelcome ? groupDb?.text?.welcome : groupDb?.text?.goodbye;
    const metadata = await bot.groupMetadata(groupJid);
    const text = customText
      ? customText
        .replace(/%tag%/g, userTag)
        .replace(/%subject%/g, metadata.subject)
        .replace(/%description%/g, metadata.description)
      : isWelcome
        ? formatter.quote(` Welcome ${userTag} to the group ${metadata.subject} !`)
        : formatter.quote(` Goodbye, ${userTag} !`);
    const profilePictureUrl = await bot.core
      .profilePictureUrl(jid, 'image')
      .catch(() => 'https://i.pinimg.com/736x/70/dd/61/70dd612c65034b88ebf474a52ccc70c4.jpg');

    await bot.sendMessage(
      groupJid,
      {
        text,
        mentions: [jid],
        contextInfo: {
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: config.bot.newsletterJid,
            newsletterName: config.bot.name,
          },
          externalAdReply: {
            title: config.bot.name,
            body: `v${require('../package.json').version} `,
            mediaType: 1,
            thumbnailUrl: profilePictureUrl,
            sourceUrl: config.bot.groupLink,
          },
        },
      },
      {
        quoted: cmd.fakeMetaAiQuotedText(config.msg.footer),
      }
    );

    if (isWelcome && groupDb?.text?.intro)
      await bot.sendMessage(
        groupJid,
        {
          text: groupDb.text.intro,
          mentions: [jid],
        },
        {
          quoted: cmd.fakeMetaAiQuotedText("Don't forget to fill out your intro!"),
        }
      );
  }
}

// Events utama bot
export default (bot, context) => {
  const {
    config,
    consolefy,
    db,
    formatter,
    tools: { cmd, msg },
  } = context;

  // bot.ev.setMaxListeners(config.system.maxListeners); // Removed as not supported in Baileys v7

  // Event saat bot siap
  bot.ev.on('connection.update', async m => {
    if (m.connection === 'open') {
      const { database } = context;
      consolefy.success(`${config.bot.name} by ${config.owner.name}, ready at ${bot.user.id} `);

      // Mulai ulang bot
      const botRestart = await database.get('restart');
      if (botRestart) {
        const { key } = botRestart;
        await bot.sendMessage(key.remoteJid, { text: '✅ Bot successfully restarted!' }, { quoted: key });
        await database.delete('restart');
      }

      const decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
          const decode = jidDecode(jid) || {};
          return (decode.user && decode.server && decode.user + '@' + decode.server) || jid;
        }
        return jid;
      };

      // Tetapkan config pada bot
      config.bot = {
        ...config.bot,
        jid: bot.user.id,
        decodedJid: decodeJid(bot.user.id),
        id: decodeJid(bot.user.id).split('@')[0],
        readyAt: bot.readyAt,
        groupLink: await bot
          .groupInviteCode(config.bot.groupJid)
          .then(code => `https://chat.whatsapp.com/${code}`)
          .catch(() => 'https://chat.whatsapp.com/FxEYZl2UyzAEI2yhaH34Ye'),
      };
    }
  });

  // Event saat bot menerima pesan
  bot.ev.on('messages.upsert', async (m, ctx) => {
    const {
      config,
      database,
      consolefy,
      formatter,
      tools: { cmd, msg },
    } = context;

    try {
      // Tambahkan data db ke ctx
      ctx.userDb = await database.user.get(ctx.sender.id);
      ctx.groupDb = ctx.isGroup() ? await database.group.get(ctx.id) : {};

      // Jalankan middleware
      const messageMiddleware = [
        // errorHandlerMiddleware, // Should be first to catch errors
        botModeMiddleware,
        // authMiddleware, // Removed incompatible middleware
        antiLinkMiddleware,
        antiMediaMiddleware,
        antiNsfwMiddleware,
        antiSpamMiddleware,
        antiTagswMiddleware,
        antiToxicMiddleware,
        auditMiddleware,
        auditFixedMiddleware,
        cooldownMiddleware,
        groupMuteMiddleware,
        inputValidationMiddleware,
        maliciousMessageMiddleware,
        menfessMiddleware,
        nightModeMiddleware,
        rateLimiterMiddleware,
        analyticsMiddleware,
        didYouMeanMiddleware // Should be last or near last
      ];

      for (const middleware of messageMiddleware) {
        if (typeof middleware === 'function') {
          const result = await middleware(ctx, context);
          if (result === false) return; // Stop processing if middleware returns false
        }
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
      // const isAdmin = isGroup ? await ctx.group().isAdmin(senderJid) : false; // Optimization: Only fetch if needed by command

      // Mengambil database
      const botDb = await database.bot.get();
      const { userDb } = ctx;
      const { groupDb } = ctx;

      // Grup atau Pribadi
      if (isGroup || isPrivate) {
        if (m.key.fromMe && !config.bot.selfMode) return;

        const { state } = context;
        state.uptime = msg.convertMsToDuration(Date.now() - config.bot.readyAt);
        state.dbSize = fs.existsSync('database.json')
          ? msg.formatSize(fs.statSync('database.json').size / 1024)
          : 'N/A';

        // Penanganan database pengguna
        if (!userDb?.username)
          await database.user.update(senderId, {
            username: `@user_${cmd.generateUID(config, senderId, false)}`,
          });
        if (!userDb?.uid || userDb?.uid !== cmd.generateUID(config, senderId))
          await database.user.update(senderId, { uid: cmd.generateUID(config, senderId) });
        if (userDb?.premium && Date.now() > userDb.premiumExpiration) {
          const { premium, premiumExpiration, ...rest } = userDb;
          await database.user.set(senderId, rest);
        }
        if (isOwner || userDb?.premium) await database.user.update(senderId, { coin: 0 });
        if (!userDb?.coin || !Number.isFinite(userDb.coin))
          await database.user.update(senderId, { coin: 500 });
      }

      // Penanganan obrolan grup
      if (isGroup) {
        if (m.key.fromMe && !config.bot.selfMode) return;

        if (!isCmd || isCmd?.didyoumean)
          consolefy.info(`Incoming message from group: ${groupId}, by: ${senderId}`); // Log pesan masuk

        // Penanganan database grup
        if (groupDb?.sewa && Date.now() > userDb?.sewaExpiration) {
          await db.delete(`group.${groupId}.sewa`);
          await db.delete(`group.${groupId}.sewaExpiration`);
        }
      }

      // Penanganan obrolan pribadi
      if (isPrivate) {
        if (m.key.fromMe && !config.bot.selfMode) return;

        if (!isCmd || isCmd?.didyoumean) consolefy.info(`Incoming message from: ${senderId}`); // Log pesan masuk
      }

    } catch (e) {
      console.error(`Error in message handler:`, e);
    }
  });

  // Event saat bot menerima panggilan
  bot.ev.on('call', async calls => {
    const {
      config,
      database,
      consolefy,
      formatter,
      tools: { cmd },
    } = context;
    if (!config.system.antiCall) return;

    for (const call of calls) {
      consolefy.info(`Incoming call from: ${bot.getId(call.from)}`); // Log panggilan masuk

      if (call.status !== 'offer') continue;

      await bot.rejectCall(call.id, call.from);
      await database.user.update(bot.getId(call.from), { banned: true });

      await bot.sendMessage(`${config.owner.id}@s.whatsapp.net`, {
        text: ` Account @${bot.getId(call.from)} has been automatically blocked for the reason ${formatter.inlineCode('Anti Call')}.`,
        mentions: [call.from],
      });

      const vcard = new VCard()
        .addName(config.owner.name)
        .addOrganization(config.owner.organization)
        .addPhoneNumber(config.owner.id)
        .toString();
      await bot.sendMessage(
        call.from,
        {
          contacts: {
            displayName: config.owner.name,
            contacts: [
              {
                vcard,
              },
            ],
          },
        },
        {
          quoted: cmd.fakeMetaAiQuotedText(
            `The bot cannot receive ${call.isVideo ? 'video' : 'voice'} calls! If you need help, please contact the Owner.`
          ),
        }
      );
    }
  });

  // Event saat pengguna bergabung atau keluar dari grup
  bot.ev.on('group-participants.update', async m => {
    if (m.action === 'add') {
      handleWelcome(bot, m, 'add');
    } else if (m.action === 'remove') {
      handleWelcome(bot, m, 'remove');
    }
  });
};

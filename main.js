import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import pino from 'pino';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import messageQueue from './src/worker.js';

const main = async context => {
  const { config } = context;

  const authDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), config.bot.authAdapter.default.authDir);
  const { state, saveCreds } = await useMultiFileAuthState(authDir);

  const logger = pino({
    level: 'silent',
  });

  const bot = makeWASocket({
    auth: state,
    logger,
    browser: ['WhatsDeX', 'Chrome', '1.0.0'],
  });

  bot.ev.on('creds.update', saveCreds);

  bot.ev.on('connection.update', update => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect.error instanceof Boom
          ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
          : true;

      console.log(
        'Connection closed due to ',
        lastDisconnect.error,
        ', reconnecting ',
        shouldReconnect
      );

      if (shouldReconnect) {
        setTimeout(() => main(context), 5000); // Re-run the main function to reconnect after 5 seconds
      }
    } else if (connection === 'open') {
      console.log('✅ Bot connected to WhatsApp!');
      console.log('Bot JID:', bot.user.id);
      global.bot = bot; // Set global bot for message processor access
    }
  });

  bot.ev.on('messages.upsert', async m => {
    const msg = m.messages[0];
    if (!msg.message) return;

    // Serialize msg to avoid circular references
    const serializableMsg = {
      key: {
        remoteJid: msg.key.remoteJid,
        fromMe: msg.key.fromMe,
        id: msg.key.id,
      },
      message: msg.message,
      type: Object.keys(msg.message)[0],
      pushName: msg.pushName,
      messageTimestamp: msg.messageTimestamp,
    };

    messageQueue.add({ serializableMsg });
  });

  return bot;
};

export default main;

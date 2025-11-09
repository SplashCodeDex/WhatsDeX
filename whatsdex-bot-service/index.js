const makeWASocket = require('@whiskeysockets/baileys').default;
const { DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const express = require('express');
const dotenv = require('dotenv');
const { Boom } = require('@hapi/boom');
const { useRedisAuthState } = require('baileys-redis-auth');
const { Queue } = require('bullmq'); // Import Queue from bullmq

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());

let bot;

// Initialize BullMQ Queue
// IMPORTANT: BullMQ requires a direct Redis connection (ioredis compatible),
// not the REST API URL/TOKEN used by @upstash/redis.
// You will need to get the REDIS_HOST, REDIS_PORT, and REDIS_PASSWORD for direct connection from Upstash.
const messageQueue = new Queue('whatsapp-messages', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
  },
});

let retryCount = 0;
const maxRetries = 10;
const initialDelay = 5000; // 5 seconds

async function connectToWhatsApp() {
  const { state, saveCreds } = await useRedisAuthState(
    {
      host: process.env.UPSTASH_REDIS_REST_URL, // This is for baileys-redis-auth
      password: process.env.UPSTASH_REDIS_REST_TOKEN, // This is for baileys-redis-auth
    },
    'whatsapp-session'
  );

  const version = [2, 2413, 1]; // Pinned version

  bot = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    browser: ['WhatsDeX', 'Chrome', '1.0.0'],
    version,
  });

  bot.ev.on('creds.update', saveCreds);

  bot.ev.on('connection.update', update => {
    const { connection, lastDisconnect, qr } = update;

    if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect.error instanceof Boom
          ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
          : true;

      if (shouldReconnect && retryCount < maxRetries) {
        retryCount++;
        const delay = initialDelay * Math.pow(2, retryCount - 1);
        console.log(`Connection closed, reconnecting in ${delay / 1000}s... (Attempt ${retryCount}/${maxRetries})`);
        setTimeout(() => connectToWhatsApp(), delay);
      } else if (retryCount >= maxRetries) {
        console.error('Max reconnection attempts reached. Exiting.');
        process.exit(1); // or some other error handling
      } else {
        console.log('Connection closed. Not reconnecting.');
      }
    } else if (connection === 'open') {
      console.log('✅ Bot connected!');
      retryCount = 0; // Reset retry count on successful connection
    }
  });

  // Add messages to BullMQ queue
  bot.ev.on('messages.upsert', async m => {
    const msg = m.messages[0];
    if (!msg.message) return;

    try {
      await messageQueue.add('incoming-whatsapp-message', { msg });
      console.log('Message added to queue:', msg.key.id);
    } catch (error) {
      console.error('Failed to add message to queue:', error);
    }
  });

  return bot;
}

// API endpoint for Next.js to trigger actions
app.post('/send', async (req, res) => {
  try {
    const { to, message } = req.body;
    if (!bot) {
      return res.status(503).send({ error: 'Bot not connected' });
    }
    await bot.sendMessage(to, message);
    res.status(200).send({ status: 'Message sent' });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Bot service listening on port ${port}`);
});

connectToWhatsApp();

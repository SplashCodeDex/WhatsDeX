const makeWASocket = require('@whiskeysockets/baileys').default;
const { DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const express = require('express');
const dotenv = require('dotenv');
const { Boom } = require('@hapi/boom');
const { useRedisAuthState } = require('baileys-redis-auth');

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());

let bot;

async function connectToWhatsApp() {
    const { state, saveCreds } = await useRedisAuthState({
        host: process.env.UPSTASH_REDIS_REST_URL,
        password: process.env.UPSTASH_REDIS_REST_TOKEN,
    }, 'whatsapp-session');

    bot = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: ['WhatsDeX', 'Chrome', '1.0.0']
    });

    bot.ev.on('creds.update', saveCreds);

    bot.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom) ?
                lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut : true;

            console.log('Connection closed, reconnecting:', shouldReconnect);
            if (shouldReconnect) {
                setTimeout(() => connectToWhatsApp(), 5000);
            }
        } else if (connection === 'open') {
            console.log('✅ Bot connected!');
        }
    });

    // Webhook to push messages to Next.js API
    bot.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message) return;

        try {
            await fetch(`${process.env.NEXT_JS_WEBHOOK_URL}/api/bot-message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.WEBHOOK_SECRET}`
                },
                body: JSON.stringify(msg),
            });
        } catch (error) {
            console.error('Failed to send webhook to Next.js:', error);
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
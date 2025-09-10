const makeWASocket = require('@whiskeysockets/baileys').default;
const {
    useMultiFileAuthState,
    DisconnectReason
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const path = require('node:path');
const {
    Boom
} = require('@hapi/boom');

module.exports = async (context) => {
    const {
        config
    } = context;

    const authDir = path.resolve(__dirname, config.bot.authAdapter.default.authDir);
    const { 
        state,
        saveCreds
    } = await useMultiFileAuthState(authDir);

    const logger = pino({
        level: 'silent'
    });

    const bot = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger,
        browser: ['WhatsDeX', 'Chrome', '1.0.0']
    });

    bot.ev.on('creds.update', saveCreds);

    bot.ev.on('connection.update', (update) => {
        const {
            connection,
            lastDisconnect,
            qr
        } = update;

        if (qr) {
            console.log('QR code received, please scan!');
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom) ?
                lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut :
                true;

            console.log('Connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect);

            if (shouldReconnect) {
                module.exports(context); // Re-run the main function to reconnect
            }
        } else if (connection === 'open') {
            console.log('✅ Bot connected to WhatsApp!');
        }
    });

    bot.ev.on('messages.upsert', async (m) => {
        console.log(JSON.stringify(m, undefined, 2));

        const msg = m.messages[0];
        if (!msg.message) return;

        const key = {
            remoteJid: msg.key.remoteJid,
            fromMe: msg.key.fromMe,
            id: msg.key.id
        }

        const messageType = Object.keys(msg.message)[0];
        if (messageType === 'conversation') {
            const text = msg.message.conversation;
            if (text === '!ping') {
                await bot.sendMessage(key.remoteJid, {
                    text: 'Pong!'
                }, {
                    quoted: msg
                });
            }
        }
    });

    return bot;
};
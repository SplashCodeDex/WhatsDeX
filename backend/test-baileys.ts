import { makeWASocket, DisconnectReason, useMultiFileAuthState, Browsers, fetchLatestBaileysVersion } from 'baileys';
import pino from 'pino';

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info');

    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`Using WA version v${version.join('.')}, isLatest: ${isLatest}`);

    // Testing different browser configurations
    const browserConfig = Browsers.macOS('Desktop'); // or ['Ubuntu', 'Chrome', '111.0.0']

    const sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'trace' }) as any,
        browser: browserConfig,
        syncFullHistory: false,
        generateHighQualityLinkPreview: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('Got QR:', qr.substring(0, 20) + '...');
            process.exit(0);
        }

        if (connection === 'close') {
            const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
            console.log('Connection closed. Status Code:', statusCode);
            process.exit(1);
        } else if (connection === 'open') {
            console.log('Connection opened');
            process.exit(0);
        }
    });
}

connectToWhatsApp().catch(err => {
    console.error('Fatal Error:', err);
    process.exit(1);
});

const { EventEmitter } = require('events');
const logger = require('../../utils/logger');
const PairingCodeHandler = require('./pairingCodeHandler');
const QRCodeHandler = require('./qrCodeHandler');
const LearningEngine = require('./learningEngine');
const SecurityManager = require('./securityManager');

class UnifiedSmartAuth extends EventEmitter {
    constructor(gktwClient) {
        super();
        this.client = gktwClient;  // @itsreimau/gktw client reference
        this.authState = 'disconnected';
        this.learningData = {};

        this.pairingCodeHandler = new PairingCodeHandler(this);
        this.qrCodeHandler = new QRCodeHandler(this);
        this.learningEngine = new LearningEngine(this);
        this.securityManager = new SecurityManager(this);

        logger.info('UnifiedSmartAuth initialized');

        this.client.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === 'close') {
                this.authState = 'disconnected';
                this.emit('disconnected', lastDisconnect.error);
            } else if (connection === 'open') {
                this.authState = 'connected';
                this.emit('connected');
            }
        });

        this.client.ev.on('creds.update', () => {
            // TODO: Save creds to database
        });
    }

    async connect() {
        try {
            await this.client.launch();
        } catch (error) {
            logger.error('Failed to connect to WhatsApp', { error });
            this.emit('error', error);
        }
    }

    async disconnect() {
        try {
            await this.client.logout();
        } catch (error) {
            logger.error('Failed to disconnect from WhatsApp', { error });
            this.emit('error', error);
        }
    }

    // Get pairing code from @itsreimau/gktw
    async getPairingCode() {
        return this.client.getCurrentPairingCode();
    }

    // Get QR code from @itsreimau/gktw
    async getQRCode() {
        return this.client.getCurrentQR();
    }
}

module.exports = UnifiedSmartAuth;

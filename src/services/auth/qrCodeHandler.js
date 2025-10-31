const logger = require('../../utils/logger');

class QRCodeHandler {
  constructor(unifiedAuth) {
    this.unifiedAuth = unifiedAuth;
    logger.info('QRCodeHandler initialized');
  }

  async getQRCode() {
    return this.unifiedAuth.getQRCode();
  }
}

module.exports = QRCodeHandler;

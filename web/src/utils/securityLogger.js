const winston = require('winston');

const securityLogger = winston.createLogger({
  level: 'warn',
  format: winston.format.json(),
  transports: [new winston.transports.File({ filename: 'security.log' })],
});

module.exports = securityLogger;

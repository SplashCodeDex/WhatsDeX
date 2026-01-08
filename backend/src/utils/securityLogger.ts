import winston from 'winston';

const securityLogger = winston.createLogger({
  level: 'warn',
  format: winston.format.json(),
  transports: [new winston.transports.File({ filename: 'security.log' })],
});

export default securityLogger;

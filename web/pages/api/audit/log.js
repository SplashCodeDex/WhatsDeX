import { createLogger, format, transports } from 'winston';
import path from 'path';
import fs from 'fs/promises';

// Initialize the logger
let logger;

async function getLogger() {
  if (logger) {
    return logger;
  }

  const logsDir = path.join(process.cwd(), 'logs', 'audit');
  await fs.mkdir(logsDir, { recursive: true });

  const fileTransport = new transports.File({
    filename: path.join(logsDir, 'audit.log'),
    format: format.combine(
      format.timestamp(),
      format.json()
    ),
  });

  logger = createLogger({
    level: 'info',
    format: format.json(),
    transports: [fileTransport],
  });

  return logger;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const logData = req.body;
    const auditLogger = await getLogger();

    // Add a timestamp if it doesn't exist
    if (!logData.timestamp) {
      logData.timestamp = new Date().toISOString();
    }

    auditLogger.info(logData);

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Error in audit log API route:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
}

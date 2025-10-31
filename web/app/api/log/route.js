import { NextResponse } from 'next/server';
import winston from 'winston';
import fs from 'fs/promises';
import path from 'path';

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'whatsdex-web' },
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // Write all logs with importance level of `info` or less to `combined.log`
    new winston.transports.File({ filename: 'logs/combined.log' }),
    // Write to console in development
    ...(process.env.NODE_ENV !== 'production' ? [new winston.transports.Console()] : []),
  ],
});

// Ensure logs directory exists
async function ensureLogsDirectory() {
  const logsDir = path.join(process.cwd(), 'logs');
  try {
    await fs.access(logsDir);
  } catch {
    await fs.mkdir(logsDir, { recursive: true });
  }
}

export async function POST(request) {
  try {
    await ensureLogsDirectory();

    const logData = await request.json();

    // Validate log data
    if (!logData || typeof logData !== 'object') {
      return NextResponse.json({ error: 'Invalid log data' }, { status: 400 });
    }

    // Log based on level or default to info
    const level = logData.level || 'info';
    const message = logData.message || JSON.stringify(logData);

    logger.log(level, message, {
      ...logData,
      timestamp: new Date().toISOString(),
      source: 'edge-middleware',
    });

    return NextResponse.json({ status: 'Log received' }, { status: 200 });
  } catch (error) {
    console.error('Failed to process log event:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Optional: GET endpoint to retrieve logs (for admin purposes)
export async function GET() {
  try {
    const logsDir = path.join(process.cwd(), 'logs');
    const combinedLogPath = path.join(logsDir, 'combined.log');

    const logs = await fs.readFile(combinedLogPath, 'utf-8');
    const logLines = logs.trim().split('\n').slice(-100); // Last 100 lines

    return NextResponse.json({ logs: logLines }, { status: 200 });
  } catch (error) {
    console.error('Failed to retrieve logs:', error);
    return NextResponse.json({ error: 'Failed to retrieve logs' }, { status: 500 });
  }
}

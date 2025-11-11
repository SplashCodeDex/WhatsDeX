import http from 'node:http';
import { Server } from 'socket.io';
import pkg from '../package.json' with { type: 'json' };

let io;

/**
 * Create and configure the HTTP server
 * @param {Object} config - Configuration object
 * @returns {Object} - { server, io } - Configured server and Socket.IO instances
 */
function createApp(config) {
  // Create HTTP server
  const server = http.createServer((_, res) => {
    res.end(`${pkg.name} is running on port ${config.system.port}`);
  });

  // Initialize Socket.IO
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('disconnect', () => {
      console.log('A user disconnected');
    });
  });

  return { server, io };
}

/**
 * Get Socket.IO instance
 * @returns {Server} - Socket.IO server instance
 */
function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized! Call createApp() first.');
  }
  return io;
}

export { createApp, getIO };

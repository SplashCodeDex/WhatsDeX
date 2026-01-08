import { Server } from 'socket.io';
import http from 'node:http';

let io: Server | null = null;

/**
 * Initialize and configure the Socket.IO server
 * @param {http.Server} server - The HTTP server instance
 * @returns {Server} - The configured Socket.IO instance
 */
function initializeSocketIO(server: http.Server): Server {
  io = new Server(server, {
    cors: {
      origin: "*", // Consider restricting this in production
      methods: ["GET", "POST"]
    }
  });

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log(`A user connected with socket ID: ${socket.id}`);

    // Room joining for tenant-specific events
    socket.on('join-tenant-room', (tenantId: string) => {
      if (tenantId) {
        socket.join(tenantId);
        console.log(`Socket ${socket.id} joined room for tenant ${tenantId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`A user disconnected with socket ID: ${socket.id}`);
    });
  });

  return io;
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

import { Server } from 'socket.io';

let io;

function initSocket(server) {
  io = new Server(server);

  io.on('connection', socket => {
    console.log('A user connected');

    socket.on('disconnect', () => {
      console.log('A user disconnected');
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
}

export { initSocket, getIO };

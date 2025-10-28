import { io } from 'socket.io-client';

let socket;

export const initSocket = () => {
  if (socket) return;

  socket = io(); // Assumes the server is on the same host

  socket.on('connect', () => {
    console.log('Connected to socket server');
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from socket server');
  });

  return socket;
};

export const getSocket = () => socket;

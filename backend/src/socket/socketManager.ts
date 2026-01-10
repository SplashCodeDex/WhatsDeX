import { Server as SocketIOServer, Socket } from 'socket.io';
import http from 'http';
import logger from '../utils/logger';

class SocketManager {
    private io: SocketIOServer;

    constructor(httpServer: http.Server) {
        this.io = new SocketIOServer(httpServer, {
            cors: {
                origin: (origin, callback) => {
                    if (!origin ||
                        origin.includes('localhost') ||
                        origin.endsWith('.whatsdx.com') ||
                        origin === process.env.NEXT_PUBLIC_APP_URL) {
                        callback(null, true);
                    } else {
                        callback(new Error('Not allowed by CORS'));
                    }
                },
                credentials: true,
            },
        });
    }

    public initialize() {
        this.io.on('connection', (socket: Socket) => {
            logger.info(`New client connected: ${socket.id}`);

            socket.on('disconnect', () => {
                logger.info(`Client disconnected: ${socket.id}`);
            });

            socket.on('join-user-room', (userId: string) => {
                logger.info(`Socket ${socket.id} joining room for user ${userId}`);
                socket.join(userId);
            });

            socket.on('get-session-status', (data: { userId: string, sessionId: string }) => {
                // In a real application, you would fetch the session status from a database or cache
                // and emit it back to the client.
                logger.info(`Received get-session-status for user ${data.userId} and session ${data.sessionId}`);
            });
        });

        logger.info('Socket.IO initialized');
    }

    public close() {
        this.io.close();
        logger.info('Socket.IO server closed');
    }
}

export default SocketManager;

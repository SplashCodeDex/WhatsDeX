import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { io as ioc, Socket as ClientSocket } from 'socket.io-client';
import SocketManager from '../socket/socketManager';

describe('SocketManager', () => {
    let httpServer: http.Server;
    let socketManager: SocketManager;
    let clientSocket: ClientSocket;
    let port: number;

    beforeAll((done) => {
        httpServer = http.createServer();
        socketManager = new SocketManager(httpServer);
        socketManager.initialize();
        httpServer.listen(() => {
            port = (httpServer.address() as any).port;
            done();
        });
    });

    afterAll(() => {
        socketManager.close();
        httpServer.close();
    });

    beforeEach((done) => {
        clientSocket = ioc(`http://localhost:${port}`);
        clientSocket.on('connect', () => {
            done();
        });
    });

    afterEach(() => {
        if (clientSocket.connected) {
            clientSocket.disconnect();
        }
    });

    it('should handle a new connection', () => {
        expect(clientSocket.connected).toBe(true);
    });

    it('should handle disconnection', (done) => {
        clientSocket.on('disconnect', () => {
            expect(clientSocket.connected).toBe(false);
            done();
        });
        clientSocket.disconnect();
    });

    it('should handle join-user-room event', (done) => {
        const userId = 'test-user';

        // The client listens for a message in the room it's about to join.
        clientSocket.on('test-event', (message) => {
            expect(message).toBe('hello from room');
            done();
        });

        // The client asks to join the room.
        clientSocket.emit('join-user-room', userId);

        // To verify the client has joined the room, the server emits an event
        // to that room. We use a small timeout to ensure the server has
        // processed the 'join-user-room' event.
        setTimeout(() => {
            socketManager['io'].to(userId).emit('test-event', 'hello from room');
        }, 500);
    });
});

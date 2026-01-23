import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import logger from '../utils/logger.js';
import { ConfigService } from './ConfigService.js';
import { Result } from '../types/contracts.js';

interface UserPayload {
    userId: string;
    email: string;
    tenantId: string;
    role: string;
    iat: number;
    exp: number;
}

export class SocketService {
    private static instance: SocketService;
    private io: Server | null = null;
    private readonly config: ConfigService;

    private constructor() {
        this.config = ConfigService.getInstance();
    }

    public static getInstance(): SocketService {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }

    public initialize(server: HttpServer): void {
        this.io = new Server(server, {
            cors: {
                origin: (origin, callback) => {
                    const allowedOrigin = this.config.get('NEXT_PUBLIC_APP_URL');
                    if (!origin || origin.includes('localhost') || origin === allowedOrigin) {
                        callback(null, true);
                    } else {
                        callback(new Error('Not allowed by CORS'));
                    }
                },
                methods: ['GET', 'POST'],
                credentials: true
            },
            path: '/api/socket'
        });

        // Authentication Middleware
        this.io.use((socket: Socket, next) => {
            try {
                let token = socket.handshake.auth.token || socket.handshake.query.token;

                if (!token && socket.handshake.headers.cookie) {
                    const cookies = cookie.parse(socket.handshake.headers.cookie);
                    token = cookies.token;
                }

                if (!token) {
                    return next(new Error('Authentication error: Token missing'));
                }

                const secret = this.config.get('JWT_SECRET');
                const decoded = jwt.verify(token, secret) as UserPayload;

                (socket as any).user = decoded;
                next();
            } catch (error) {
                logger.security('Socket Auth: Connection failed', null, { error: (error as Error).message });
                next(new Error('Authentication error: Invalid token'));
            }
        });

        this.io.on('connection', (socket: Socket) => {
            const user = (socket as any).user as UserPayload;
            const roomName = `tenants:${user.tenantId}`;

            socket.join(roomName);
            logger.info(`Socket connected: ${socket.id} joined room ${roomName}`);

            socket.on('disconnect', () => {
                logger.info(`Socket disconnected: ${socket.id}`);
            });
        });

        logger.info('Unified Socket Service initialized');
    }

    /**
     * Emit generic event to a specific tenant room
     */
    public emitToTenant<T>(tenantId: string, event: string, data: T): Result<void> {
        if (!this.io) {
            return { success: false, error: new Error('Socket.io not initialized') };
        }

        try {
            const roomName = `tenants:${tenantId}`;
            this.io.to(roomName).emit(event, {
                ...data,
                timestamp: new Date().toISOString()
            });
            return { success: true, data: undefined };
        } catch (error) {
            logger.error(`Failed to emit socket event: ${event}`, {
                error: (error as Error).message,
                tenantId
            });
            return { success: false, error: error as Error };
        }
    }

    /**
     * Legacy helper for campaign progress
     * @deprecated Use emitToTenant directly with 'campaign_update' event
     */
    public emitProgress(tenantId: string, campaignId: string, stats: any): Result<void> {
        return this.emitToTenant(tenantId, 'campaign_update', { campaignId, stats });
    }
}

export const socketService = SocketService.getInstance();

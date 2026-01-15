import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';
import { ConfigService } from '../services/ConfigService.js';

interface UserPayload {
    userId: string;
    email: string;
    tenantId: string;
    role: string;
    iat: number;
    exp: number;
}

declare global {
    namespace Express {
        interface Request {
            user?: UserPayload;
        }
    }
}

/**
 * Middleware to authenticate requests using Custom JWT (issued by authController)
 * Expected Header: Authorization: Bearer <JWT>
 */
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = (authHeader && authHeader.split(' ')[1]) || req.cookies?.token;

        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        const config = ConfigService.getInstance();
        const secret = config.get('JWT_SECRET'); // Strict config access

        // Verify Custom JWT
        try {
            const decoded = jwt.verify(token, secret) as UserPayload;
            req.user = decoded;
            next();
        } catch (jwtError: unknown) {
            if (jwtError instanceof Error && jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({ error: 'Token expired' });
            }
            throw new Error('Invalid token signature');
        }

    } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.security('Auth Middleware: Token verification failed', null, { error: err.message, ip: req.ip });
        return res.status(403).json({ error: 'Invalid or unauthorized token' });
    }
};

/**
 * Middleware to restrict access to specific roles
 */
export const authorizeRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = req.user;

        if (!user || !roles.includes(user.role)) {
            logger.security('Auth Middleware: Insufficient permissions', user?.userId, {
                requiredRoles: roles,
                userRole: user?.role
            });
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };
};

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';
import { ConfigService } from '../services/ConfigService.js';
import { cacheService } from '../services/cache.js';

interface UserPayload {
    userId: string;
    email: string;
    tenantId: string;
    role: string;
    iat: number;
    exp: number;
}

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
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
        const source = authHeader ? 'header' : (req.cookies?.token ? 'cookie' : 'none');

        const isMeRoute = req.path === '/me' || req.originalUrl?.endsWith('/me');

        if (!token) {
            if (isMeRoute) {
                return res.status(200).json({ success: true, data: { user: null } });
            }
            logger.security('Auth Middleware: Missing token', null, { ip: req.ip });
            return res.status(401).json({ success: false, error: 'Access token required' });
        }

        const config = ConfigService.getInstance();
        const secret = config.get('JWT_SECRET');

        if (!secret) {
            logger.security('Auth Middleware: JWT_SECRET not configured', null, { ip: req.ip });
            return res.status(401).json({ success: false, error: 'Authentication system misconfigured' });
        }

        // Check Blacklist - Resilient
        try {
            const isBlacklisted = await cacheService.isTokenBlacklisted(token);
            if (isBlacklisted.success && isBlacklisted.data) {
                logger.security('Auth Middleware: Blacklisted token', null, { token: token.substring(0, 10) + '...', ip: req.ip });
                return res.status(401).json({ success: false, error: 'Token has been revoked' });
            }
        } catch (cacheError) {
            // Log but don't fail auth if cache is down
            logger.warn('Auth Middleware: Blacklist check skipped (cache unavailable)');
        }

        // Verify Custom JWT
        try {
            const decoded = jwt.verify(token, secret) as UserPayload;
            req.user = decoded;
            return next();
        } catch (jwtError: unknown) {
            const name = jwtError instanceof Error ? jwtError.name : 'UnknownError';
            const message = jwtError instanceof Error ? jwtError.message : String(jwtError);

            if (isMeRoute) {
                return res.status(200).json({ success: true, data: { user: null } });
            }

            logger.security('Auth Middleware: Token verification failed', null, {
                error: message,
                type: name,
                source,
                ip: req.ip
            });

            if (name === 'TokenExpiredError') {
                return res.status(401).json({ success: false, error: 'Token expired' });
            }
            return res.status(403).json({ success: false, error: `Auth error: ${name}` });
        }

    } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Auth Middleware Critical Error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error in auth pipeline' });
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
            return res.status(403).json({ success: false, error: 'Insufficient permissions' });
        }

        next();
    };
};

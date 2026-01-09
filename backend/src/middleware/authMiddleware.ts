import { Request, Response, NextFunction } from 'express';
import { auth } from '../lib/firebase.js';
import logger from '../utils/logger.js';

/**
 * Middleware to authenticate requests using Firebase Auth ID Tokens
 * Expected Header: Authorization: Bearer <ID_TOKEN>
 */
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = (authHeader && authHeader.split(' ')[1]) || (req as any).cookies?.token;

        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        // Verify Firebase ID Token
        const decodedToken = await auth.verifyIdToken(token);
        
        // Populate request with user info
        (req as any).user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            // Assuming tenantId is stored in custom claims during user creation/login
            tenantId: decodedToken.tenantId || 'default',
            role: decodedToken.role || 'user'
        };

        next();
    } catch (error: any) {
        logger.error('Auth Middleware: Token verification failed:', error.message);
        
        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({ error: 'Token expired' });
        }
        
        return res.status(403).json({ error: 'Invalid or unauthorized token' });
    }
};

/**
 * Middleware to restrict access to specific roles
 */
export const authorizeRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;
        
        if (!user || !roles.includes(user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        
        next();
    };
};
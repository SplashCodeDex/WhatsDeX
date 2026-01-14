import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = (authHeader && authHeader.split(' ')[1]) || req.cookies?.token;

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db, admin } from '../lib/firebase.js'; // Added admin import
import { Timestamp } from 'firebase-admin/firestore';
import { ConfigService } from '../services/ConfigService.js';
import auditService from '../services/auditService.js';
import { stripeService } from '../services/stripe.js';
import { multiTenantService } from '../services/multiTenantService.js';
import logger from '../utils/logger.js';
// Removed firebaseService import

interface AuthUserPayload {
    userId: string;
    tenantId: string;
    role: string;
    email: string;
    iat: number;
    exp: number;
}

interface RequestWithUser extends Request {
    user?: AuthUserPayload;
}

const signupSchema = z.object({
    displayName: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    tenantName: z.string().min(2).optional(),
    subdomain: z.string().min(2).regex(/^[a-z0-9-]+$/).optional(),
    plan: z.enum(['FREE', 'BASIC', 'PRO', 'ENTERPRISE']).default('FREE'),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

interface AvailabilityResult {
    email?: { available: boolean; reason: string | null };
    subdomain?: { available: boolean; reason: string | null };
}

// Helper for internal availability checks
const checkAvailabilityHelper = async (email: string, subdomain: string) => {
    // Check email
    const userSnapshot = await db.collection('tenant_users').where('email', '==', email).limit(1).get();
    if (!userSnapshot.empty) return { available: false, reason: 'Email already registered', field: 'email' };

    // Check subdomain
    const tenantSnapshot = await db.collection('tenants').where('subdomain', '==', subdomain).limit(1).get();
    if (!tenantSnapshot.empty) return { available: false, reason: 'Subdomain already taken', field: 'subdomain' };

    return { available: true };
};

export const checkAvailability = async (req: Request, res: Response) => {
    try {
        const { email, subdomain } = req.query;
        const result: AvailabilityResult = {};

        if (email) {
            const userSnapshot = await db.collection('tenant_users').where('email', '==', String(email)).limit(1).get();
            const existingUser = !userSnapshot.empty;
            result.email = { available: !existingUser, reason: existingUser ? 'Email already registered' : null };
        }

        if (subdomain) {
            const tenantSnapshot = await db.collection('tenants').where('subdomain', '==', String(subdomain)).limit(1).get();
            const existingTenant = !tenantSnapshot.empty;
            result.subdomain = { available: !existingTenant, reason: existingTenant ? 'Subdomain already taken' : null };
        }

        res.json(result);
    } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Error in checkAvailability:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const signup = async (req: Request, res: Response) => {
    try {
        logger.info('DEBUG: Signup request received', { body: req.body });
        const payload = signupSchema.parse(req.body);
        let { displayName, email, password, tenantName, subdomain, plan } = payload;

        const name = displayName;

        if (!tenantName) {
            tenantName = `${name}'s Workspace`;
        }

        if (!subdomain) {
            const baseSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 10);
            subdomain = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
        }

        // Check availability
        logger.info('DEBUG: Checking availability for', { tenantName, subdomain, email });
        const availability = await checkAvailabilityHelper(email, subdomain);
        if (!availability.available) {
            logger.warn('DEBUG: Availability check failed', availability);
            return res.status(400).json({ error: availability.reason, field: availability.field });
        }

        // Delegate tenant and user creation to the service
        const result = await multiTenantService.createNewTenantWithUser({
            tenantName: tenantName,
            subdomain: subdomain,
            plan,
            user: {
                displayName: name,
                email,
                password,
            },
        });

        if (!result.success) {
            // If the service returns an error, pass it to the client
            return res.status(500).json({ error: result.error.message });
        }

        const { user, tenant } = result.data;

        const config = ConfigService.getInstance();
        const jwtSecret = config.get('JWT_SECRET');

        const token = jwt.sign(
            { userId: user.id, tenantId: tenant.id, role: user.role },
            jwtSecret,
            { expiresIn: '7d' }
        );

        // Audit Logging
        await auditService.logEvent({
            eventType: 'USER_REGISTER',
            actor: email,
            actorId: user.id,
            action: 'Account Created',
            resource: 'tenant',
            resourceId: tenant.id,
            details: { plan, subdomain },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(201).json({
            success: true,
            token,
            user: { id: user.id, name: user.displayName, email: user.email },
            tenant: { id: tenant.id, name: tenant.name, subdomain: tenant.subdomain },
        });

    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            logger.warn('Signup validation failed:', error.issues);
            return res.status(400).json({ error: error.issues[0].message, field: error.issues[0].path[0] });
        }
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Signup error:', err);
        res.status(500).json({ error: 'An unexpected error occurred during registration' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = loginSchema.parse(req.body);

        // Get user from Firestore to retrieve tenantId and role
        const userSnapshot = await db.collection('tenant_users').where('email', '==', email).limit(1).get();

        if (userSnapshot.empty) {
            await auditService.logEvent({
                eventType: 'SECURITY_LOGIN_FAILURE',
                actor: email,
                action: 'Login attempt failed: User not found',
                resource: 'auth',
                riskLevel: 'MEDIUM',
                ipAddress: req.ip
            });
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const userDoc = userSnapshot.docs[0];
        const user = userDoc.data();

        if (user.status !== 'ACTIVE') {
            return res.status(401).json({ success: false, error: 'Account disabled' });
        }

        // Verify password via Firebase Auth REST API
        // Firebase Admin SDK doesn't expose password verification directly,
        // so we use the Firebase Auth REST API
        const firebaseApiKey = process.env.FIREBASE_WEB_API_KEY;
        if (!firebaseApiKey) {
            logger.error('FIREBASE_WEB_API_KEY not configured');
            return res.status(500).json({ success: false, error: 'Authentication service misconfigured' });
        }

        try {
            const authResponse = await fetch(
                `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseApiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email,
                        password,
                        returnSecureToken: true
                    })
                }
            );

            if (!authResponse.ok) {
                const errorData = await authResponse.json() as { error?: { message?: string } };
                logger.warn('Firebase Auth failed:', errorData.error?.message);
                await auditService.logEvent({
                    eventType: 'SECURITY_LOGIN_FAILURE',
                    actor: email,
                    actorId: user.id,
                    action: 'Login attempt failed: Wrong password',
                    resource: 'auth',
                    riskLevel: 'MEDIUM',
                    ipAddress: req.ip
                });
                return res.status(401).json({ success: false, error: 'Invalid credentials' });
            }
        } catch (authError: unknown) {
            logger.error('Firebase Auth request failed:', authError);
            return res.status(500).json({ success: false, error: 'Authentication service unavailable' });
        }

        const config = ConfigService.getInstance();
        const jwtSecret = config.get('JWT_SECRET');

        const token = jwt.sign(
            { userId: user.id, tenantId: user.tenantId, role: user.role, email: user.email },
            jwtSecret,
            { expiresIn: '7d' }
        );

        await auditService.logEvent({
            eventType: 'USER_LOGIN',
            actor: email,
            actorId: user.id,
            action: 'Login successful',
            resource: 'auth',
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({
            success: true,
            token,
            user: { id: user.id, name: user.displayName || user.name || 'User', email: user.email, role: user.role },
            tenant: { id: user.tenantId }
        });

    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, error: error.issues[0].message });
        }
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Login error:', err);
        res.status(500).json({ success: false, error: 'An unexpected error occurred' });
    }
};


export const logout = (req: Request, res: Response) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });

    // Also clear legacy cookie if present
    res.clearCookie('session', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });

    res.json({ success: true, message: 'Logged out successfully' });
};

export const getMe = async (req: RequestWithUser, res: Response) => {
    try {
        if (!req.user?.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userDoc = await db.collection('tenant_users').doc(req.user.userId).get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }
        const user = userDoc.data()!;

        const tenantDoc = await db.collection('tenants').doc(user.tenantId).get();
        const tenant = tenantDoc.data() || { id: user.tenantId, name: 'Unknown', subdomain: 'unknown' };

        res.json({
            user: { id: user.id, name: user.displayName || user.name || 'User', email: user.email, role: user.role },
            tenant: { id: tenant.id, name: tenant.name, subdomain: tenant.subdomain },
        });
    } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('getMe error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

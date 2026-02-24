import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import crypto from 'node:crypto';
import { db, admin } from '@/lib/firebase.js';
import { Timestamp } from 'firebase-admin/firestore';
import { ConfigService } from '@/services/ConfigService.js';
import auditService from '@/services/auditService.js';
import logger from '@/utils/logger.js';
import { multiTenantService } from '@/services/multiTenantService.js';
import { firebaseService } from '@/services/FirebaseService.js';

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
    firstName: z.string().min(1),
    lastName: z.string().min(1),
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

const googleLoginSchema = z.object({
    idToken: z.string().min(1),
});

interface AvailabilityResult {
    email?: { available: boolean; reason: string | null };
    subdomain?: { available: boolean; reason: string | null };
}

// Helper for internal availability checks
const checkAvailabilityHelper = async (email: string, subdomain: string) => {
    // Check email in global users lookup
    const userSnapshot = await db.collection('users').where('email', '==', email).limit(1).get();
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
            const userSnapshot = await db.collection('users').where('email', '==', String(email)).limit(1).get();
            const existingUser = !userSnapshot.empty;
            result.email = { available: !existingUser, reason: existingUser ? 'Email already registered' : null };
        }

        if (subdomain) {
            const tenantSnapshot = await db.collection('tenants').where('subdomain', '==', String(subdomain)).limit(1).get();
            const existingTenant = !tenantSnapshot.empty;
            result.subdomain = { available: !existingTenant, reason: existingTenant ? 'Subdomain already taken' : null };
        }

        res.json({ success: true, data: result });
    } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Error in checkAvailability:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

export const loginWithGoogle = async (req: Request, res: Response) => {
    try {
        const { idToken } = googleLoginSchema.parse(req.body);

        // 1. Verify Google Token
        const decodedToken = await firebaseService.verifyIdToken(idToken);
        const { uid, email, name, picture } = decodedToken;

        if (!email) {
            return res.status(400).json({ success: false, error: 'Google account must have an email address' });
        }

        // 2. Check for User Lookup
        let lookupDoc = await db.collection('users').doc(uid).get();
        let tenantId: string;
        let role: string;
        let displayName = name || 'User';

        if (!lookupDoc.exists) {
            // 3. New User - Check for Email Conflict (Option B)
            const emailConflict = await db.collection('users').where('email', '==', email).limit(1).get();
            if (!emailConflict.empty) {
                logger.warn('Google Login: Email conflict detected', { email, uid });
                return res.status(409).json({
                    success: false,
                    error: 'An account with this email already exists. Please sign in with your original method.',
                    code: 'auth/email-already-in-use'
                });
            }

            // 4. Auto-Initialize Workspace
            const baseSlug = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 10);
            const subdomain = `${baseSlug}-${crypto.randomBytes(2).toString('hex')}`;
            const tenantName = `${displayName}'s Workspace`;

            const initResult = await multiTenantService.initializeTenant({
                userId: uid,
                email,
                displayName,
                tenantName,
                subdomain,
                plan: 'starter'
            });

            if (!initResult.success) {
                return res.status(500).json({ success: false, error: 'Failed to initialize your workspace' });
            }

            tenantId = initResult.data.tenant.id;
            role = 'owner';

            // Set Custom Claims
            await admin.auth().setCustomUserClaims(uid, { tenantId, role });
        } else {
            // 5. Existing User
            const data = lookupDoc.data()!;
            tenantId = data.tenantId;
            role = data.role;
        }

        // 6. Get Full Data & Set Session
        const userDoc = await db.collection('tenants').doc(tenantId).collection('users').doc(uid).get();
        const tenantDoc = await db.collection('tenants').doc(tenantId).get();

        if (!userDoc.exists || !tenantDoc.exists) {
            return res.status(404).json({ success: false, error: 'Workspace data inconsistent' });
        }

        const user = userDoc.data()!;
        const tenant = tenantDoc.data()!;

        const config = ConfigService.getInstance();
        const jwtSecret = config.get('JWT_SECRET');

        const token = jwt.sign(
            { userId: uid, tenantId, role, email },
            jwtSecret,
            { expiresIn: '7d' }
        );

        const firebaseToken = await admin.auth().createCustomToken(uid, { tenantId, role });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // Update last login
        db.collection('tenants').doc(tenantId).collection('users').doc(uid).update({
            lastLogin: Timestamp.now()
        }).catch(e => logger.error('Failed to update last login', e));

        res.json({
            success: true,
            data: {
                token,
                firebaseToken,
                user: { id: uid, name: user.displayName || displayName, email, role, tenantId },
                tenant: { id: tenantId, name: tenant.name, subdomain: tenant.subdomain },
            }
        });

    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, error: error.issues[0].message });
        }
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Google Login error:', err);
        res.status(500).json({ success: false, error: 'Authentication failed' });
    }
};

export const signup = async (req: Request, res: Response) => {
    try {
        logger.info('Signup request received', { email: req.body.email });
        const payload = signupSchema.parse(req.body);
        const { firstName, lastName, email, password, subdomain: rawSubdomain, plan } = payload;
        let { tenantName } = payload;

        const displayName = `${firstName} ${lastName}`.trim();

        if (!tenantName) {
            tenantName = `${displayName}'s Workspace`;
        }

        let subdomain = rawSubdomain;
        if (!subdomain) {
            const baseSlug = displayName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 10);
            subdomain = `${baseSlug}-${crypto.randomBytes(2).toString('hex')}`;
        }

        // Check availability
        const availability = await checkAvailabilityHelper(email, subdomain);
        if (!availability.available) {
            return res.status(400).json({ success: false, error: availability.reason, field: availability.field });
        }

        // 1. Create Firebase Auth User
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName,
        });

        const userId = userRecord.uid;

        // 2. Initialize Tenant & User via MultiTenantService
        const initResult = await multiTenantService.initializeTenant({
            userId,
            email,
            displayName,
            tenantName,
            subdomain,
            plan: plan === 'FREE' ? 'starter' : plan.toLowerCase()
        });

        if (!initResult.success) {
            // Rollback Firebase User if possible (optional, but good)
            await admin.auth().deleteUser(userId).catch(e => logger.error('Cleanup: Failed to delete user after init failure', e));
            return res.status(500).json({ success: false, error: 'Failed to initialize account environment' });
        }

        const { tenant, user } = initResult.data;

        // 3. Set Custom Claims
        await admin.auth().setCustomUserClaims(userId, {
            tenantId: tenant.id,
            role: 'owner'
        });

        const config = ConfigService.getInstance();
        const jwtSecret = config.get('JWT_SECRET');

        const token = jwt.sign(
            { userId, tenantId: tenant.id, role: 'owner', email },
            jwtSecret,
            { expiresIn: '7d' }
        );

        // Audit Logging
        await auditService.logEvent({
            eventType: 'USER_REGISTER',
            actor: email,
            actorId: userId,
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
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        const firebaseToken = await admin.auth().createCustomToken(userId, { tenantId: tenant.id, role: 'owner' });

        res.status(201).json({
            success: true,
            data: {
                token,
                firebaseToken,
                user: { id: userId, name: displayName, email, role: 'owner', tenantId: tenant.id },
                tenant: { id: tenant.id, name: tenant.name, subdomain: tenant.subdomain },
            }
        });

    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, error: error.issues[0].message, field: error.issues[0].path[0] });
        }
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Signup error:', err);
        res.status(500).json({ success: false, error: 'An unexpected error occurred during registration' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = loginSchema.parse(req.body);

        const firebaseApiKey = process.env.FIREBASE_WEB_API_KEY;
        if (!firebaseApiKey) {
            logger.error('FIREBASE_WEB_API_KEY not configured');
            return res.status(500).json({ success: false, error: 'Authentication service misconfigured' });
        }

        let uid: string;
        try {
            const authResponse = await fetch(
                `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseApiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, returnSecureToken: true })
                }
            );

            if (!authResponse.ok) {
                const errorData = await authResponse.json() as any;
                logger.warn('Login: Firebase Auth failed', { email, error: errorData.error?.message });
                return res.status(401).json({ success: false, error: 'Invalid email or password' });
            }

            const authData = await authResponse.json() as any;
            uid = authData.localId;
        } catch (authError: unknown) {
            logger.error('Login: Firebase Auth request failed', authError);
            return res.status(500).json({ success: false, error: 'Authentication service unavailable' });
        }

        // 2. Get User Lookup
        const lookupDoc = await db.collection('users').doc(uid).get();
        if (!lookupDoc.exists) {
            logger.error('Login: User lookup missing for UID', { uid, email });
            return res.status(404).json({ success: false, error: 'User profile not found' });
        }
        const { tenantId, role } = lookupDoc.data()!;

        // 3. Get Full User Data from Subcollection
        const userDoc = await db.collection('tenants').doc(tenantId).collection('users').doc(uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({ success: false, error: 'Account data not found in tenant' });
        }
        const user = userDoc.data()!;

        if (user.status === 'suspended') {
            return res.status(403).json({ success: false, error: 'Account suspended' });
        }

        const tenantDoc = await db.collection('tenants').doc(tenantId).get();
        if (!tenantDoc.exists) {
            logger.error('Login: Tenant not found for tenantId', { tenantId, uid });
            return res.status(404).json({ success: false, error: 'Tenant data not found' });
        }
        const tenant = tenantDoc.data()!;

        const config = ConfigService.getInstance();
        const jwtSecret = config.get('JWT_SECRET');

        const token = jwt.sign(
            { userId: uid, tenantId, role, email: user.email },
            jwtSecret,
            { expiresIn: '7d' }
        );

        const firebaseToken = await admin.auth().createCustomToken(uid, { tenantId, role });

        await auditService.logEvent({
            eventType: 'USER_LOGIN',
            actor: email,
            actorId: uid,
            action: 'Login successful',
            resource: 'auth',
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        // Update last login (Async)
        db.collection('tenants').doc(tenantId).collection('users').doc(uid).update({
            lastLogin: Timestamp.now()
        }).catch(e => logger.error('Failed to update last login', e));

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({
            success: true,
            data: {
                token,
                firebaseToken,
                user: { id: uid, name: user.displayName || 'User', email: user.email, role, tenantId },
                tenant: { id: tenantId, name: tenant.name, subdomain: tenant.subdomain },
            }
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
        sameSite: 'lax',
    });

    res.json({ success: true, data: { message: 'Logged out successfully' } });
};

export const getMe = async (req: RequestWithUser, res: Response) => {
    try {
        if (!req.user?.userId || !req.user?.tenantId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const { userId, tenantId } = req.user;

        const userDoc = await db.collection('tenants').doc(tenantId).collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        const user = userDoc.data()!;

        const tenantDoc = await db.collection('tenants').doc(tenantId).get();
        const tenant = tenantDoc.data() || { id: tenantId, name: 'Unknown', subdomain: 'unknown' };

        // Generate Custom Token for Firebase Client SDK
        const firebaseToken = await admin.auth().createCustomToken(userId, { tenantId, role: user.role });

        res.json({
            success: true,
            data: {
                user: { id: user.id, name: user.displayName, email: user.email, role: user.role, tenantId },
                tenant: { id: tenant.id, name: tenant.name, subdomain: tenant.subdomain },
                firebaseToken
            }
        });
    } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('getMe error detail:', {
            message: err.message,
            stack: err.stack,
            userId: req.user?.userId,
            tenantId: req.user?.tenantId
        });
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve user profile',
            message: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

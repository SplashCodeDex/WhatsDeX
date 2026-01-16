import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db, admin } from '../lib/firebase.js'; // Added admin import
import { Timestamp } from 'firebase-admin/firestore';
import { ConfigService } from '../services/ConfigService.js';
import auditService from '../services/auditService.js';
import { stripeService } from '../services/stripe.js';
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

// Helper for internal, transactional availability checks
const checkAvailabilityInTransaction = async (
    transaction: FirebaseFirestore.Transaction,
    email: string,
    subdomain: string
) => {
    // Check email
    const userQuery = db.collection('tenant_users').where('email', '==', email).limit(1);
    const userSnapshot = await transaction.get(userQuery);
    if (!userSnapshot.empty) {
        return { available: false, reason: 'Email already registered', field: 'email' };
    }

    // Check subdomain
    const tenantQuery = db.collection('tenants').where('subdomain', '==', subdomain).limit(1);
    const tenantSnapshot = await transaction.get(tenantQuery);
    if (!tenantSnapshot.empty) {
        return { available: false, reason: 'Subdomain already taken', field: 'subdomain' };
    }

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

        // Create tenant and user
        logger.info('DEBUG: Creating tenant and user in Firebase');

        // Use Firebase transaction to ensure data integrity
        const result = await db.runTransaction(async (transaction: FirebaseFirestore.Transaction) => { // Using db.runTransaction
            // 1. Check availability within the transaction
            const availability = await checkAvailabilityInTransaction(transaction, email, subdomain!);
            if (!availability.available) {
                // By throwing an error, we abort the transaction and can catch it outside.
                const error: any = new Error(availability.reason);
                error.field = availability.field;
                error.isAvailabilityError = true;
                throw error;
            }

            // 2. Create Tenant
            logger.info('DEBUG: Creating tenant document');
            const tenantId = `tenant-${Date.now()}`;
            const tenantRef = db.collection('tenants').doc(tenantId); // Using db directly

            const tenantData = {
                id: tenantId,
                name: tenantName!,
                subdomain: subdomain!,
                plan, // Default to FREE
                createdAt: new Date(),
                updatedAt: new Date(),
                status: 'ACTIVE',
                settings: {
                    theme: 'light',
                    notifications: true,
                },
            };

            transaction.set(tenantRef, tenantData);

            // 2. Create User
            logger.info('DEBUG: Creating user in Firebase Auth');
            const userRecord = await admin.auth().createUser({ // Using admin.auth() directly
                email,
                password,
                displayName: name,
            });

            logger.info('DEBUG: Creating user document');
            const userRef = db.collection('tenant_users').doc(userRecord.uid); // Using tenant_users for consistency with other parts of code?
            // Wait, previous code used 'users'. Let's check checkAvailability usage: 'tenant_users'.
            // The codebase seems to use 'tenant_users'. I will stick to 'tenant_users'.

            const userData = {
                id: userRecord.uid,
                email,
                displayName: name,
                tenantId,
                role: 'ADMIN', // First user is Admin
                createdAt: new Date(),
                updatedAt: new Date(),
                status: 'ACTIVE',
            };

            transaction.set(userRef, userData);

            // 3. Plan Handling
            const planCode = plan.toUpperCase();
            const plansSnapshot = await db.collection('plans').where('code', '==', planCode).limit(1).get();
            const planDoc = plansSnapshot.empty ? null : plansSnapshot.docs[0];
            const planData = planDoc ? planDoc.data() : null;

            if (planData && planDoc) {
                let stripeSubscriptionId = `free_${Date.now()}`;
                let stripePriceId = 'FREE';

                if (planData.code !== 'FREE') {
                    try {
                        const customer = await stripeService.createCustomer({ userId: userRecord.uid, email, name, phone: undefined }); // userRef.id -> userRecord.uid
                        const planKey = planData.code.toLowerCase();
                        const subscription = await stripeService.createSubscription(customer.id, planKey, { userId: userRecord.uid });
                        stripeSubscriptionId = subscription.id;
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        stripePriceId = (subscription.items.data[0] as any).price.id;
                    } catch (stripeErr) {
                        logger.error('Stripe signup failed, falling back', stripeErr instanceof Error ? stripeErr : new Error(String(stripeErr)));
                    }
                }

                const subRef = db.collection('tenant_subscriptions').doc();
                transaction.set(subRef, {
                    id: subRef.id,
                    tenantId: tenantData.id, // tenantRef.id -> tenantData.id/tenantId
                    planId: planDoc.id,
                    status: planData.code === 'FREE' ? 'active' : 'trialing',
                    currentPeriodStart: Timestamp.now(),
                    currentPeriodEnd: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
                    stripeSubscriptionId,
                    stripePriceId,
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now(),
                });
            }

            return { tenant: tenantData, user: userData };
        });

        const config = ConfigService.getInstance();
        const jwtSecret = config.get('JWT_SECRET');

        const token = jwt.sign(
            { userId: result.user.id, tenantId: result.tenant.id, role: result.user.role },
            jwtSecret,
            { expiresIn: '7d' }
        );

        // Audit Logging
        await auditService.logEvent({
            eventType: 'USER_REGISTER',
            actor: email,
            actorId: result.user.id,
            action: 'Account Created',
            resource: 'tenant',
            resourceId: result.tenant.id,
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
            user: { id: result.user.id, name: result.user.displayName, email: result.user.email },
            tenant: { id: result.tenant.id, name: result.tenant.name, subdomain: result.tenant.subdomain },
        });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            logger.warn('Signup validation failed:', error.issues);
            return res.status(400).json({ error: error.issues[0].message, field: error.issues[0].path[0] });
        }
        if (error.isAvailabilityError) {
            logger.warn('DEBUG: Availability check failed within transaction', { reason: error.message, field: error.field });
            return res.status(400).json({ error: error.message, field: error.field });
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

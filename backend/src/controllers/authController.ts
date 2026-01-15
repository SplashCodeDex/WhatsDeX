import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '../lib/firebase.js';
import { Timestamp } from 'firebase-admin/firestore';
import { ConfigService } from '../services/ConfigService.js';
import auditService from '../services/auditService.js';
import { stripeService } from '../services/stripe.js';

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
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    tenantName: z.string().min(2),
    subdomain: z.string().min(2).regex(/^[a-z0-9-]+$/),
    plan: z.enum(['FREE', 'BASIC', 'PRO', 'ENTERPRISE']).default('FREE'),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export const checkAvailability = async (req: Request, res: Response) => {
    try {
        const { email, subdomain } = req.query;
        const result: any = {};

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
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const signup = async (req: Request, res: Response) => {
    try {
        const payload = signupSchema.parse(req.body);
        const { name, email, password, tenantName, subdomain, plan } = payload;

        // Check for existing user
        const userSnapshot = await db.collection('tenant_users').where('email', '==', email).limit(1).get();
        if (!userSnapshot.empty) {
            return res.status(400).json({ error: 'Email already in use', field: 'email' });
        }

        // Check for existing tenant
        const tenantSnapshot = await db.collection('tenants').where('subdomain', '==', subdomain).limit(1).get();
        if (!tenantSnapshot.empty) {
            return res.status(400).json({ error: 'Subdomain already taken', field: 'subdomain' });
        }

        const hashedPassword = await bcrypt.hash(password, 12); // 2026: Higher rounds

        const result = await db.runTransaction(async (transaction) => {
            const tenantRef = db.collection('tenants').doc();
            const tenantData = {
                id: tenantRef.id,
                name: tenantName,
                subdomain,
                email,
                status: 'active',
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            };
            transaction.set(tenantRef, tenantData);

            const userRef = db.collection('tenant_users').doc();
            const userData = {
                id: userRef.id,
                tenantId: tenantRef.id,
                name,
                email,
                passwordHash: hashedPassword,
                role: 'admin',
                isActive: true,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            };
            transaction.set(userRef, userData);

            // Plan handling
            if (plan) {
                const planCode = plan.toUpperCase();
                const plansSnapshot = await db.collection('plans').where('code', '==', planCode).limit(1).get();
                const planDoc = plansSnapshot.empty ? null : plansSnapshot.docs[0];
                const planData = planDoc ? planDoc.data() : null;

                if (planData && planDoc) {
                    let stripeSubscriptionId = `free_${Date.now()}`;
                    let stripePriceId = 'FREE';

                    if (planData.code !== 'FREE') {
                        try {
                            const customer = await stripeService.createCustomer({ userId: userRef.id, email, name, phone: undefined });
                            const planKey = planData.code.toLowerCase();
                            const subscription = await stripeService.createSubscription(customer.id, planKey, { userId: userRef.id });
                            stripeSubscriptionId = subscription.id;
                            stripePriceId = (subscription.items.data[0] as any).price.id;
                        } catch (stripeErr) {
                            console.error('Stripe signup failed, falling back', stripeErr);
                        }
                    }

                    const subRef = db.collection('tenant_subscriptions').doc();
                    transaction.set(subRef, {
                        id: subRef.id,
                        tenantId: tenantRef.id,
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
            user: { id: result.user.id, name: result.user.name, email: result.user.email },
            tenant: { id: result.tenant.id, name: result.tenant.name, subdomain: result.tenant.subdomain },
        });

    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.issues[0].message, field: error.issues[0].path[0] });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
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

        if (!user.isActive) {
            return res.status(401).json({ success: false, error: 'Account disabled' });
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
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
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
            tenant: { id: user.tenantId }
        });

    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, error: error.issues[0].message });
        }
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
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
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
            tenant: { id: tenant.id, name: tenant.name, subdomain: tenant.subdomain },
        });
    } catch (error: unknown) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '../lib/firebase.js';
import { Timestamp } from 'firebase-admin/firestore';

interface RequestWithUser extends Request {
    user?: {
        userId: string;
        tenantId: string;
        role: string;
    };
}

const signupSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    tenantName: z.string().min(2),
    subdomain: z.string().min(2).regex(/^[a-z0-9-]+$/),
    plan: z.string().optional(),
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
    } catch (error: any) {
        console.error('Availability check error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const signup = async (req: Request, res: Response) => {
    try {
        const { name, email, password, tenantName, subdomain, plan } = req.body;

        // Validate core fields
        signupSchema.parse({ name, email, password, tenantName, subdomain, plan });

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

        const hashedPassword = await bcrypt.hash(password, 10);

        // Transactional creation
        const result = await db.runTransaction(async (transaction) => {
            // Create Tenant
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

            // Create User
            const userRef = db.collection('tenant_users').doc();
            const userData = {
                id: userRef.id,
                tenantId: tenantRef.id,
                name,
                email,
                passwordHash: hashedPassword,
                role: 'admin',
                isActive: true, // explicit active flag
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            };
            transaction.set(userRef, userData);

            // Handle Plan Subscription
            if (plan) {
                const planCode = plan.toUpperCase();
                // Find plan
                const plansSnapshot = await db.collection('plans').where('code', '==', planCode).limit(1).get();
                let planDoc = plansSnapshot.empty ? null : plansSnapshot.docs[0];
                let planData = planDoc ? planDoc.data() : null;

                if (!planData) {
                    // Fallback to FREE
                    const freePlanSnapshot = await db.collection('plans').where('code', '==', 'FREE').limit(1).get();
                    if (!freePlanSnapshot.empty) {
                        planDoc = freePlanSnapshot.docs[0];
                        planData = planDoc.data();
                    }
                }

                if (planData && planDoc) {
                    let stripeSubscriptionId = `free_${Date.now()}`;
                    let stripePriceId = 'FREE';

                    if (planData.code !== 'FREE') {
                        try {
                            const stripeSvcModule: any = await import('../services/stripe.js');
                            const StripeSvcClass = stripeSvcModule.default || stripeSvcModule;
                            const stripeSvc = new StripeSvcClass();
                            const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
                            await stripeSvc.initialize(process.env.STRIPE_SECRET_KEY, webhookSecret);

                            // Create customer
                            const customer = await stripeSvc.createCustomer({ userId: userRef.id, email, name, phone: null });
                            const planKey = planData.code.toLowerCase();
                            const subscription = await stripeSvc.createSubscription(customer.id, planKey, { userId: userRef.id });
                            stripeSubscriptionId = subscription.id;
                            const priceId = stripeSvc.getPlans?.()[planKey]?.priceId;
                            stripePriceId = priceId || subscription.items?.data?.[0]?.price?.id || 'unknown';
                        } catch (stripeErr) {
                            console.error('Stripe initialization failed during signup, proceeding with local subscription only', stripeErr);
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

        const token = jwt.sign(
            { userId: result.user.id, tenantId: result.tenant.id, role: result.user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '7d' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(201).json({
            success: true,
            message: 'Signup successful',
            token,
            user: { id: result.user.id, name: result.user.name, email: result.user.email },
            tenant: { id: result.tenant.id, name: result.tenant.name, subdomain: result.tenant.subdomain },
        });

    } catch (error: any) {
        console.error('Signup error:', error);
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
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const userDoc = userSnapshot.docs[0];
        const user = userDoc.data();

        if (!user.isActive) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        // Get tenant
        const tenantDoc = await db.collection('tenants').doc(user.tenantId).get();
        if (!tenantDoc.exists) {
            return res.status(401).json({ success: false, error: 'Tenant not found' });
        }
        const tenant = tenantDoc.data()!;

        const token = jwt.sign(
            { userId: user.id, tenantId: user.tenantId, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '7d' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
            tenant: { id: tenant.id, name: tenant.name, subdomain: tenant.subdomain },
        });

    } catch (error: any) {
        console.error('Login error:', error);
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
    } catch (error: any) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

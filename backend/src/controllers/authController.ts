import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import fs from 'fs';

const prisma = new PrismaClient();

const signupSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    tenantName: z.string().min(2),
    subdomain: z.string().min(2).regex(/^[a-z0-9-]+$/),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export const checkAvailability = async (req, res) => {
    try {
        const { email, subdomain } = req.query;
        const result = {};

        if (email) {
            const existingUser = await prisma.tenantUser.findFirst({ where: { email: String(email) } });
            result.email = { available: !existingUser, reason: existingUser ? 'Email already registered' : null };
        }

        if (subdomain) {
            const existingTenant = await prisma.tenant.findUnique({ where: { subdomain: String(subdomain) } });
            result.subdomain = { available: !existingTenant, reason: existingTenant ? 'Subdomain already taken' : null };
        }

        res.json(result);
    } catch (error) {
        console.error('Availability check error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const signup = async (req, res) => {
    try {
        // Allow extra fields like plan
        const { name, email, password, tenantName, subdomain, plan } = req.body;

        // Validate core fields
        signupSchema.parse({ name, email, password, tenantName, subdomain });

        const existingUser = await prisma.tenantUser.findFirst({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already in use', field: 'email' });
        }

        const existingTenant = await prisma.tenant.findUnique({ where: { subdomain } });
        if (existingTenant) {
            return res.status(400).json({ error: 'Subdomain already taken', field: 'subdomain' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
                data: {
                    name: tenantName,
                    subdomain,
                    email,
                    status: 'active', // Default to active
                },
            });

            const user = await tx.tenantUser.create({
                data: {
                    tenantId: tenant.id,
                    name,
                    email,
                    passwordHash: hashedPassword,
                    role: 'admin',
                },
            });

            // Handle Plan Subscription
            if (plan) {
                // Find plan by code (case-insensitive)
                const planCode = plan.toUpperCase();
                let planRecord = await tx.plan.findUnique({ where: { code: planCode } });

                // Fallback to FREE if not found (or handle 'BASIC' mapping if needed)
                if (!planRecord) {
                    planRecord = await tx.plan.findUnique({ where: { code: 'FREE' } });
                }

                if (planRecord) {
                    // Create Stripe customer + subscription if not FREE
                    let stripeSubscriptionId = `free_${Date.now()}`;
                    let stripePriceId = 'FREE';
                    if (planRecord.code !== 'FREE') {
                        const StripeService = (await import('../services/stripe.js')).default || (await import('../services/stripe.js')).default;
                        const stripeSvcModule = await import('../services/stripe.js');
                        const StripeSvcClass = stripeSvcModule.default || stripeSvcModule;
                        const stripeSvc = new StripeSvcClass();
                        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
                        await stripeSvc.initialize(process.env.STRIPE_SECRET_KEY, webhookSecret);
                        // Create customer for tenant
                        const customer = await stripeSvc.createCustomer({ userId: user.id, email, name, phone: null });
                        // Map plan to stripe planKey (lowercase code)
                        const planKey = planRecord.code.toLowerCase();
                        const subscription = await stripeSvc.createSubscription(customer.id, planKey, { userId: user.id });
                        stripeSubscriptionId = subscription.id;
                        const priceId = stripeSvc.getPlans?.()[planKey]?.priceId;
                        stripePriceId = priceId || subscription.items?.data?.[0]?.price?.id || 'unknown';
                    }
                    await tx.tenantSubscription.create({
                        data: {
                            tenantId: tenant.id,
                            planId: planRecord.id,
                            status: planRecord.code === 'FREE' ? 'active' : 'trialing',
                            currentPeriodStart: new Date(),
                            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                            stripeSubscriptionId: stripeSubscriptionId,
                            stripePriceId: stripePriceId,
                        }
                    });
                }
            }

            return { tenant, user };
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
    } catch (error) {
        console.error('Signup error:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors[0].message, field: error.errors[0].path[0] });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = loginSchema.parse(req.body);

        const user = await prisma.tenantUser.findFirst({
            where: { email },
            include: { tenant: true },
        });

        if (!user || !user.isActive) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user.id, tenantId: user.tenant.id, role: user.role },
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
            tenant: { id: user.tenant.id, name: user.tenant.name, subdomain: user.tenant.subdomain },
        });
    } catch (error) {
        console.error('Login error:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, error: error.errors[0].message });
        }
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

export const getMe = async (req, res) => {
    try {
        // Assumes middleware attaches user to req
        const user = await prisma.tenantUser.findUnique({
            where: { id: req.user.userId },
            include: { tenant: true },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
            tenant: { id: user.tenant.id, name: user.tenant.name, subdomain: user.tenant.subdomain },
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

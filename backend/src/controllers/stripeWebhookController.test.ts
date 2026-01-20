import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { handleStripeWebhook } from './stripeWebhookController.js';
import stripeService from '../services/stripeService.js';
import { db } from '../lib/firebase.js';

// Mock dependencies
vi.mock('../services/stripeService.js', () => ({
  default: {
    stripe: {
      webhooks: {
        constructEvent: vi.fn(),
      },
      subscriptions: {
        retrieve: vi.fn(),
      },
    },
  },
}));

vi.mock('../lib/firebase.js', () => ({
  db: {
    collection: vi.fn().mockReturnThis(),
    doc: vi.fn().mockReturnThis(),
    get: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('../services/ConfigService.js', () => ({
  ConfigService: {
    getInstance: vi.fn().mockReturnValue({
      get: vi.fn().mockImplementation((key: string) => {
        if (key === 'STRIPE_WEBHOOK_SECRET') return 'whsec_test';
        return undefined;
      }),
    }),
  },
}));

describe('StripeWebhookController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = {
      body: { id: 'evt_123' },
      headers: {
        'stripe-signature': 'sig_123',
      },
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      send: vi.fn(),
    };
  });

  it('should return 400 if signature is missing', async () => {
    mockReq.headers = {};
    await handleStripeWebhook(mockReq as Request, mockRes as Response);
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  it('should handle checkout.session.completed and update Firestore', async () => {
    // Mock event check
    (db.collection('').doc('').get as any).mockResolvedValue({ exists: false });

    const mockSession = {
      id: 'cs_123',
      subscription: 'sub_123',
      customer: 'cus_123',
      metadata: {
        tenantId: 'tenant-123',
        userId: 'user-123',
        planId: 'pro',
      },
    };

    (stripeService.stripe.webhooks.constructEvent as any).mockReturnValue({
      id: 'evt_123',
      type: 'checkout.session.completed',
      data: { object: mockSession },
    });

    (stripeService.stripe.subscriptions.retrieve as any).mockResolvedValue({
      id: 'sub_123',
      status: 'trialing',
      current_period_end: 1735689600, // 2025-01-01
      trial_end: 1735689600,
    });

    await handleStripeWebhook(mockReq as Request, mockRes as Response);

    expect(db.collection).toHaveBeenCalledWith('tenants');
    expect(db.doc).toHaveBeenCalledWith('tenant-123');
    expect(db.update).toHaveBeenCalledWith(expect.objectContaining({
      planTier: 'pro',
      subscriptionStatus: 'trialing',
    }));
  });
});

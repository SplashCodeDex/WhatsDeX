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

  it('should return 200 and handle valid events', async () => {
    // Mock event check
    (db.collection('').doc('').get as any).mockResolvedValue({ exists: false });

    (stripeService.stripe.webhooks.constructEvent as any).mockReturnValue({
      id: 'evt_123',
      type: 'checkout.session.completed',
      data: { object: {} },
    });

    await handleStripeWebhook(mockReq as Request, mockRes as Response);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ received: true });
    expect(db.collection('').doc('').set).toHaveBeenCalled();
  });

  it('should return 200 and skip if event already processed', async () => {
    // Mock event check
    (db.collection('').doc('').get as any).mockResolvedValue({ exists: true });

    (stripeService.stripe.webhooks.constructEvent as any).mockReturnValue({
      id: 'evt_123',
    });

    await handleStripeWebhook(mockReq as Request, mockRes as Response);

    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ alreadyProcessed: true }));
    expect(db.collection('').doc('').set).not.toHaveBeenCalled();
  });
});
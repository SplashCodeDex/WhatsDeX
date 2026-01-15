import { describe, it, expect } from 'vitest';
import { hasFeatureAccess, getPlanLimits, isTrialActive } from './featureGating.js';
import { Timestamp } from 'firebase-admin/firestore';

describe('Feature Gating Utility', () => {
  const mockTenant = (overrides: any = {}) => ({
    id: 't1',
    planTier: 'starter',
    subscriptionStatus: 'active',
    ...overrides
  });

  describe('hasFeatureAccess', () => {
    it('should deny access if subscription is canceled', () => {
      const tenant = mockTenant({ subscriptionStatus: 'canceled' });
      expect(hasFeatureAccess(tenant, 'ai')).toBe(false);
    });

    it('should allow AI for pro plan', () => {
      const tenant = mockTenant({ planTier: 'pro' });
      expect(hasFeatureAccess(tenant, 'ai')).toBe(true);
    });

    it('should deny AI for starter plan unless enabled', () => {
      const tenant = mockTenant({ planTier: 'starter' });
      expect(hasFeatureAccess(tenant, 'ai')).toBe(false);

      const tenantEnabled = mockTenant({ planTier: 'starter', settings: { aiEnabled: true } });
      expect(hasFeatureAccess(tenantEnabled, 'ai')).toBe(true);
    });

    it('should allow backups for all plans', () => {
      const tenant = mockTenant({ planTier: 'starter' });
      expect(hasFeatureAccess(tenant, 'backups')).toBe(true);
    });
  });

  describe('getPlanLimits', () => {
    it('should return starter limits', () => {
      const limits = getPlanLimits('starter');
      expect(limits.maxBots).toBe(1);
      expect(limits.aiType).toBe('basic');
    });

    it('should return pro limits', () => {
      const limits = getPlanLimits('pro');
      expect(limits.maxBots).toBe(3);
      expect(limits.aiType).toBe('advanced');
    });

    it('should return enterprise limits', () => {
      const limits = getPlanLimits('enterprise');
      expect(limits.maxBots).toBe(10);
      expect(limits.maxBroadcasts).toBe(Infinity);
    });
  });

  describe('isTrialActive', () => {
    it('should return true if trialing and date is future', () => {
      const futureDate = new Date(Date.now() + 10000000);
      const tenant = mockTenant({ subscriptionStatus: 'trialing', trialEndsAt: futureDate });
      expect(isTrialActive(tenant)).toBe(true);
    });

    it('should return false if trialing and date is past', () => {
      const pastDate = new Date(Date.now() - 10000000);
      const tenant = mockTenant({ subscriptionStatus: 'trialing', trialEndsAt: pastDate });
      expect(isTrialActive(tenant)).toBe(false);
    });

    it('should return false if not trialing', () => {
        const futureDate = new Date(Date.now() + 10000000);
        const tenant = mockTenant({ subscriptionStatus: 'active', trialEndsAt: futureDate });
        expect(isTrialActive(tenant)).toBe(false);
    });
  });
});

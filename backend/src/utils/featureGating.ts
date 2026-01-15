import { Tenant } from '@/types/index.js';
import { Timestamp } from 'firebase-admin/firestore';

export type Feature = 'ai' | 'backups' | 'broadcast' | 'analytics';

export interface PlanLimits {
  maxBots: number;
  maxBroadcasts: number;
  aiType: 'basic' | 'advanced' | 'none';
  analyticsLevel: 'basic' | 'advanced' | 'enterprise';
}

/**
 * Utility to check if a tenant has access to a specific feature
 */
export const hasFeatureAccess = (tenant: Tenant, feature: Feature): boolean => {
  const plan = tenant.planTier || 'starter';
  
  // Check if trial has expired and status is not active
  if (tenant.subscriptionStatus === 'canceled') return false;
  if (tenant.subscriptionStatus === 'unpaid') return false;

  switch (feature) {
    case 'ai':
      return plan !== 'starter' || (tenant.settings?.aiEnabled ?? false);
    case 'backups':
      return true; // Included in all tiers
    case 'broadcast':
      return true; // All tiers, but limits differ
    case 'analytics':
      return true;
    default:
      return false;
  }
};

/**
 * Get limits associated with a plan tier
 */
export const getPlanLimits = (planTier: 'starter' | 'pro' | 'enterprise'): PlanLimits => {
  switch (planTier) {
    case 'enterprise':
      return {
        maxBots: 10,
        maxBroadcasts: Infinity,
        aiType: 'advanced',
        analyticsLevel: 'enterprise'
      };
    case 'pro':
      return {
        maxBots: 3,
        maxBroadcasts: 5000,
        aiType: 'advanced',
        analyticsLevel: 'advanced'
      };
    case 'starter':
    default:
      return {
        maxBots: 1,
        maxBroadcasts: 500,
        aiType: 'basic',
        analyticsLevel: 'basic'
      };
  }
};

/**
 * Check if the tenant is currently in a valid trial period
 */
export const isTrialActive = (tenant: Tenant): boolean => {
  if (tenant.subscriptionStatus !== 'trialing') return false;
  if (!tenant.trialEndsAt) return false;

  const now = Date.now();
  const trialEnd = tenant.trialEndsAt instanceof Timestamp 
    ? tenant.trialEndsAt.toMillis() 
    : new Date(tenant.trialEndsAt).getTime();

  return now < trialEnd;
};

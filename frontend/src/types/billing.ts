export type PlanTier = 'starter' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'trialing' | 'active' | 'canceled' | 'past_due' | 'unpaid';

export interface SubscriptionInfo {
  plan: PlanTier;
  status: SubscriptionStatus;
  trialEndsAt?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface CheckoutSessionResponse {
  url: string;
}

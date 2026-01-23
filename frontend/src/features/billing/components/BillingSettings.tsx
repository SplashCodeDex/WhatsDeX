'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Rocket, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { billingApi } from '@/lib/api/billing';
import { SubscriptionInfo } from '@/types/billing';
import { toast } from 'sonner';

export function BillingSettings() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const data = await billingApi.getSubscription();
        setSubscription(data);
      } catch (error) {
        toast.error('Failed to load subscription info');
      } finally {
        setIsLoading(false);
      }
    }
    fetchSubscription();
  }, []);

  if (isLoading) {
    return <div className="h-48 animate-pulse rounded-lg bg-muted" />;
  }

  if (!subscription) return null;

  const isTrialing = subscription.status === 'trialing';

  // Calculate trial progress if applicable
  let trialProgress = 0;
  let trialDaysLeft = 0;

  if (isTrialing && subscription.trialEndsAt) {
    const start = new Date(subscription.trialEndsAt).getTime() - (7 * 24 * 60 * 60 * 1000); // approx start
    const end = new Date(subscription.trialEndsAt).getTime();
    const now = Date.now();
    const total = end - start;
    const elapsed = now - start;
    trialProgress = Math.min(100, Math.max(0, (elapsed / total) * 100));
    trialDaysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Current Plan Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
            <Rocket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{subscription.planTier}</div>
            <p className="text-xs text-muted-foreground capitalize">
              {subscription.status} Status
            </p>
          </CardContent>
        </Card>

        {/* Trial Status / Billing Cycle */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isTrialing ? 'Trial Period' : 'Billing Cycle'}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isTrialing ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{trialDaysLeft} days remaining</span>
                  <span className="text-muted-foreground">Ends {new Date(subscription.trialEndsAt!).toLocaleDateString()}</span>
                </div>
                <Progress value={trialProgress} className="h-2" />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm">Next billing date: {new Date(subscription.currentPeriodEnd || Date.now()).toLocaleDateString()}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Subscription</CardTitle>
          <CardDescription>
            Update your payment method, view invoices, or change your plan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => window.open(process.env.NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL || '#', '_blank')}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Open Customer Portal
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

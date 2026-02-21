'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Rocket, Zap, Shield, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { billingApi } from '@/lib/api/billing';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type PlanId = 'starter' | 'pro' | 'enterprise';

const PLANS = [
  {
    id: 'starter' as PlanId,
    name: 'Starter',
    description: 'Perfect for individuals and small projects.',
    monthlyPrice: 9.99,
    yearlyPrice: 99,
    features: [
      '1 Bot Account',
      'Basic AI Integration',
      '500 Broadcasts / mo',
      'Standard Backups',
      'Community Support',
    ],
    icon: Rocket,
  },
  {
    id: 'pro' as PlanId,
    name: 'Pro',
    description: 'Advanced features for growing businesses.',
    monthlyPrice: 19.99,
    yearlyPrice: 199,
    features: [
      '3 Bot Accounts',
      'Advanced Gemini AI',
      '5,000 Broadcasts / mo',
      'Priority Backups',
      'Advanced Analytics',
      'Priority Support',
    ],
    icon: Zap,
    popular: true,
  },
  {
    id: 'enterprise' as PlanId,
    name: 'Enterprise',
    description: 'Unlimited power for agencies and organizations.',
    monthlyPrice: 49.99,
    yearlyPrice: 499,
    features: [
      '10 Bot Accounts',
      'Advanced Gemini AI',
      'Unlimited Broadcasts',
      'Enterprise-Grade Backups',
      'Custom Analytics',
      '24/7 Dedicated Support',
      'White-label Options',
    ],
    icon: Shield,
  },
];

export function PricingTable() {
  const [interval, setInterval] = useState<'month' | 'year'>('month');
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);

  const handleCheckout = async (planId: PlanId) => {
    if (planId === 'enterprise') {
      // For enterprise, redirect to contact/sales
      toast.info('Please contact our sales team for enterprise pricing');
      return;
    }

    try {
      setLoadingPlan(planId);
      const response = await billingApi.createCheckoutSession(planId, interval);
      
      if (response.url) {
        // Redirect to Stripe checkout
        window.location.href = response.url;
      } else {
        toast.error('Failed to create checkout session');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Failed to start checkout process');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          Choose the Perfect Plan for Your{' '}
          <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
            Scale
          </span>
        </h2>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Start with a 7-day free trial. No credit card required to explore.
        </p>

        <div className="mt-10 flex justify-center">
          <Tabs
            defaultValue="month"
            onValueChange={(v: string) => setInterval(v as 'month' | 'year')}
            className="w-[300px]"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="month">Monthly</TabsTrigger>
              <TabsTrigger value="year">
                Yearly
                <Badge variant="secondary" className="ml-2 scale-75 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Save 20%
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <motion.div
            key={plan.id}
            whileHover={{ y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <Card className={cn(
              "relative flex h-full flex-col overflow-hidden border-2",
              plan.popular ? 'border-primary shadow-xl' : 'border-border'
            )}>
              {plan.popular && (
                <div className="absolute right-0 top-0 rounded-bl-xl bg-primary px-4 py-1 text-xs font-bold text-primary-foreground shadow-sm">
                  MOST POPULAR
                </div>
              )}

              <CardHeader>
                <div className={cn(
                  "mb-4 flex h-12 w-12 items-center justify-center rounded-xl",
                  plan.popular 
                    ? "bg-accent/10 text-accent" 
                    : "bg-primary/10 text-primary"
                )}>
                  <plan.icon size={24} />
                </div>
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-base">{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="flex-1">
                <div className="mb-8 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight">
                    ${interval === 'month' ? plan.monthlyPrice : plan.yearlyPrice}
                  </span>
                  <span className="text-muted-foreground">
                    /{interval === 'month' ? 'mo' : 'yr'}
                  </span>
                </div>

                <div className="space-y-4">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
                        <Check size={14} />
                      </div>
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>

              <CardFooter className="pt-8">
                <Button
                  className="w-full py-6 text-lg font-semibold"
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => handleCheckout(plan.id)}
                  disabled={loadingPlan !== null}
                >
                  {loadingPlan === plan.id ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    plan.id === 'enterprise' ? 'Contact Sales' : 'Start 7-Day Free Trial'
                  )}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Trust Badge / Features */}
      <div className="mt-20 grid grid-cols-1 gap-8 border-t border-border pt-16 md:grid-cols-3">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles size={24} />
          </div>
          <h4 className="mb-2 font-semibold">Try Before You Buy</h4>
          <p className="text-sm text-muted-foreground">7 full days to explore all features risk-free.</p>
        </div>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Zap size={24} />
          </div>
          <h4 className="mb-2 font-semibold">Instant Activation</h4>
          <p className="text-sm text-muted-foreground">Get started in seconds. No complex setup required.</p>
        </div>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Shield size={24} />
          </div>
          <h4 className="mb-2 font-semibold">Cancel Anytime</h4>
          <p className="text-sm text-muted-foreground">No long-term contracts. Change or cancel your plan anytime.</p>
        </div>
      </div>
    </div>
  );
}

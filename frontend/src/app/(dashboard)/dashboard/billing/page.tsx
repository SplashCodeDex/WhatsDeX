'use client';

import React from 'react';
import { BillingSettings } from '@/features/billing/components/BillingSettings';
import { PricingTable } from '@/features/billing/components/PricingTable';

export default function BillingPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Billing & Subscription</h2>
        <p className="text-muted-foreground">
          Manage your plan, payment methods, and billing history.
        </p>
      </div>

      <BillingSettings />
      
      <div className="pt-8">
        <h3 className="mb-6 text-xl font-semibold">Available Plans</h3>
        <PricingTable />
      </div>
    </div>
  );
}

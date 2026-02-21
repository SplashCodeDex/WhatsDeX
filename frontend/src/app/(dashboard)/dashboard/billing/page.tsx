'use client';

import React, { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  BillingSettings, 
  PricingTable, 
  InvoiceHistory, 
  PaymentMethods 
} from '@/features/billing';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, FileText, Package } from 'lucide-react';

export default function BillingPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Handle Stripe checkout success/cancel callbacks
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const sessionId = searchParams.get('session_id');

    if (success === 'true') {
      toast.success('Subscription activated!', {
        description: 'Your 7-day free trial has started. Welcome aboard!',
      });
      
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard/billing');
    } else if (canceled === 'true') {
      toast.info('Checkout canceled', {
        description: 'No charges were made. You can try again anytime.',
      });
      
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard/billing');
    }
  }, [searchParams]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Billing & Subscription</h2>
        <p className="text-muted-foreground">
          Manage your plan, payment methods, and billing history.
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
          <TabsTrigger value="overview">
            <Package className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="plans">
            Plans
          </TabsTrigger>
          <TabsTrigger value="payment">
            <CreditCard className="mr-2 h-4 w-4" />
            Payment
          </TabsTrigger>
          <TabsTrigger value="invoices">
            <FileText className="mr-2 h-4 w-4" />
            Invoices
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <BillingSettings />
        </TabsContent>

        <TabsContent value="plans" className="mt-6">
          <PricingTable />
        </TabsContent>

        <TabsContent value="payment" className="mt-6">
          <PaymentMethods />
        </TabsContent>

        <TabsContent value="invoices" className="mt-6">
          <InvoiceHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}

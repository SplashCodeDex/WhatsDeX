import React from 'react';
import { PricingTable } from '@/features/billing/components/PricingTable';

export const metadata = {
  title: 'Pricing - WhatsDeX',
  description: 'Choose the right plan for your WhatsApp automation needs. Start with a 7-day free trial.',
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background pt-20">
      <PricingTable />
    </div>
  );
}

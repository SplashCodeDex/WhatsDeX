'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Crown } from 'lucide-react';

const plans = [
  {
    code: 'FREE',
    name: 'Free Plan',
    description: 'Perfect for getting started',
    price: 0,
    features: [
      '10 AI requests per month',
      '100 messages per day',
      '1 bot',
      'Basic AI chat',
      'Community support'
    ],
    popular: false,
    icon: Zap
  },
  {
    code: 'PRO',
    name: 'Pro Plan',
    description: 'Best for growing businesses',
    price: 29,
    features: [
      '1,000 AI requests per month',
      '1,000 messages per day',
      '5 bots',
      'Advanced AI + RAG',
      '50 media generations per day',
      'Image generation',
      'Advanced tools',
      'Email support'
    ],
    popular: true,
    icon: Crown
  },
  {
    code: 'BUSINESS',
    name: 'Business Plan',
    description: 'For enterprise needs',
    price: 99,
    features: [
      '10,000 AI requests per month',
      '5,000 messages per day',
      '50 bots',
      'Full AI features + Video',
      '500 media generations per day',
      'All advanced tools',
      'Priority support',
      'Custom integrations'
    ],
    popular: false,
    icon: Crown
  }
];

export default function OnboardingPage() {
  const [selectedPlan, setSelectedPlan] = useState('PRO');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePlanSelect = async (planCode) => {
    setSelectedPlan(planCode);
    setLoading(true);
    
    try {
      // Store selected plan and redirect to bot creation
      localStorage.setItem('selectedPlan', planCode);
      router.push('/onboarding/create-bot');
    } catch (error) {
      console.error('Error selecting plan:', error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Select the perfect plan for your WhatsApp bot needs. You can upgrade or downgrade anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isSelected = selectedPlan === plan.code;
            
            return (
              <Card 
                key={plan.code}
                className={`relative cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''
                } ${plan.popular ? 'border-blue-500' : ''}`}
                onClick={() => setSelectedPlan(plan.code)}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500">
                    Most Popular
                  </Badge>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div className={`p-3 rounded-full ${plan.popular ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <Icon className={`h-8 w-8 ${plan.popular ? 'text-blue-600' : 'text-gray-600'}`} />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-gray-600">
                    {plan.description}
                  </CardDescription>
                  <div className="flex items-center justify-center mt-4">
                    <span className="text-4xl font-bold text-gray-900">
                      ${plan.price}
                    </span>
                    <span className="text-gray-600 ml-2">/month</span>
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full ${
                      plan.popular 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-gray-900 hover:bg-gray-800'
                    }`}
                    onClick={() => handlePlanSelect(plan.code)}
                    disabled={loading}
                  >
                    {loading && selectedPlan === plan.code ? 'Selecting...' : 'Select Plan'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-8 text-gray-600">
          <p>All plans include a 7-day free trial • Cancel anytime • No setup fees</p>
        </div>
      </div>
    </div>
  );
}
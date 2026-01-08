'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

const plans = [
    {
        id: 'free',
        name: 'Free',
        price: 0,
        description: 'Perfect for getting started',
        features: ['1 WhatsApp Bot', '3 Team Members', '100 Messages/month', '10 AI Requests/month', 'Basic Support', 'Web Dashboard'],
        buttonText: 'Start Free',
        popular: false
    },
    {
        id: 'basic',
        name: 'Basic',
        price: 29.99,
        description: 'Great for small businesses',
        features: ['3 WhatsApp Bots', '10 Team Members', '5,000 Messages/month', '500 AI Requests/month', 'Priority Support', 'Analytics Dashboard', 'Custom Branding', 'API Access'],
        buttonText: 'Start 14-day Trial',
        popular: true
    },
    {
        id: 'pro',
        name: 'Pro',
        price: 99.99,
        description: 'Perfect for growing companies',
        features: ['10 WhatsApp Bots', '50 Team Members', '50,000 Messages/month', '5,000 AI Requests/month', 'Advanced Analytics', 'Webhook Integration', 'Custom AI Training', 'Multi-language Support', 'White-label Options'],
        buttonText: 'Start 14-day Trial',
        popular: false
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: 299.99,
        description: 'For large organizations',
        features: ['Unlimited WhatsApp Bots', 'Unlimited Team Members', 'Unlimited Messages', 'Unlimited AI Requests', 'Dedicated Support', 'Custom Integrations', 'On-premise Deployment', 'SLA Guarantee', 'Advanced Security', 'Custom Development'],
        buttonText: 'Contact Sales',
        popular: false
    }
];

export const Pricing: React.FC = () => {
    return (
        <section id="pricing" className="py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Simple, Transparent Pricing
                    </h2>
                    <p className="text-xl text-gray-600">
                        Choose the perfect plan for your business needs. All plans include our core features.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {plans.map((plan) => (
                        <Card
                            key={plan.id}
                            className={`relative border-2 transition-all hover:shadow-lg ${plan.popular ? 'border-blue-500 shadow-lg' : 'border-gray-200'
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                    <Badge className="bg-blue-500 text-white">Most Popular</Badge>
                                </div>
                            )}
                            <CardHeader>
                                <CardTitle className="text-xl">{plan.name}</CardTitle>
                                <div className="text-3xl font-bold">
                                    ${plan.price}
                                    <span className="text-sm font-normal text-gray-600">/month</span>
                                </div>
                                <CardDescription>{plan.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <ul className="space-y-2">
                                    {plan.features.map((feature, index) => (
                                        <li key={index} className="flex items-center text-sm">
                                            <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <Button
                                    className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                                    variant={plan.popular ? 'default' : 'outline'}
                                    onClick={() => window.open('/register', '_blank')}
                                >
                                    {plan.buttonText}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
};

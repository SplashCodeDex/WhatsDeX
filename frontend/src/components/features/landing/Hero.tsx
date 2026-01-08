'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, MessageSquare, Check } from 'lucide-react';

export const Hero: React.FC = () => {
    return (
        <section className="pt-20 pb-16 bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <Badge className="mb-4 bg-blue-100 text-blue-800">🚀 Now Available: Multi-Tenant SaaS Platform</Badge>
                    <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                        Transform Your Business with
                        <span className="text-blue-600"> WhatsApp Automation</span>
                    </h1>
                    <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                        Launch your own WhatsApp SaaS platform in minutes. Complete multi-tenant architecture with
                        customer authentication, Stripe billing, and real-time analytics. Ready for enterprise deployment.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            size="lg"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4"
                            onClick={() => window.location.href = '/register'}
                        >
                            <Play className="h-5 w-5 mr-2" />
                            Start Free Trial
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="px-8 py-4"
                            onClick={() => window.open('#demo', '_self')}
                        >
                            <MessageSquare className="h-5 w-5 mr-2" />
                            Watch Demo
                        </Button>
                    </div>
                    <div className="mt-8 flex justify-center space-x-8 text-sm text-gray-500">
                        <div className="flex items-center">
                            <Check className="h-4 w-4 text-green-500 mr-1" />
                            14-day free trial
                        </div>
                        <div className="flex items-center">
                            <Check className="h-4 w-4 text-green-500 mr-1" />
                            No credit card required
                        </div>
                        <div className="flex items-center">
                            <Check className="h-4 w-4 text-green-500 mr-1" />
                            Setup in under 2 minutes
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

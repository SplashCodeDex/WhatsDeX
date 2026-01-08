'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, CreditCard, BarChart3, Shield, Globe, Zap } from 'lucide-react';

const features = [
    {
        icon: <Bot className="h-8 w-8 text-blue-600" />,
        title: "Multi-Tenant WhatsApp Bots",
        description: "Deploy unlimited WhatsApp bots for your customers with isolated data and configurations."
    },
    {
        icon: <CreditCard className="h-8 w-8 text-green-600" />,
        title: "Stripe Payment Integration",
        description: "Built-in subscription billing with automatic plan enforcement and customer management."
    },
    {
        icon: <BarChart3 className="h-8 w-8 text-purple-600" />,
        title: "Real-time Analytics",
        description: "Live dashboards showing message volumes, user engagement, and revenue metrics."
    },
    {
        icon: <Shield className="h-8 w-8 text-red-600" />,
        title: "Enterprise Security",
        description: "JWT authentication, role-based access, audit logging, and data isolation."
    },
    {
        icon: <Globe className="h-8 w-8 text-indigo-600" />,
        title: "Subdomain Architecture",
        description: "Each customer gets their own subdomain with branded experience and isolated access."
    },
    {
        icon: <Zap className="h-8 w-8 text-yellow-600" />,
        title: "Instant Deployment",
        description: "Zero-config setup with automatic scaling and infrastructure management."
    }
];

export const Features: React.FC = () => {
    return (
        <section id="features" className="py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Everything You Need for WhatsApp SaaS
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Built from the ground up for multi-tenancy, scalability, and enterprise-grade security.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                            <CardHeader>
                                <div className="flex items-center">
                                    {feature.icon}
                                    <CardTitle className="ml-3 text-xl">{feature.title}</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600">{feature.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
};

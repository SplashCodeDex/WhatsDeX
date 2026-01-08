'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';

const testimonials = [
    {
        name: "Sarah Johnson",
        company: "TechStart Inc",
        role: "CEO",
        content: "WhatsDeX transformed our customer engagement. We went from manual responses to automated, intelligent conversations that scale with our business.",
        rating: 5
    },
    {
        name: "Miguel Rodriguez",
        company: "E-commerce Plus",
        role: "Operations Director",
        content: "The multi-tenant architecture is exactly what we needed. Each of our clients gets their own branded bot experience while we manage everything centrally.",
        rating: 5
    },
    {
        name: "Dr. Emily Chen",
        company: "HealthTech Solutions",
        role: "Founder",
        content: "Implementation was incredibly smooth. Within hours, we had our first WhatsApp bot running and processing patient inquiries automatically.",
        rating: 5
    }
];

export const Testimonials: React.FC = () => {
    return (
        <section className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Trusted by Growing Businesses
                    </h2>
                    <p className="text-xl text-gray-600">
                        See what our customers are saying about WhatsDeX
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, index) => (
                        <Card key={index} className="bg-white border-0 shadow-lg">
                            <CardContent className="pt-6">
                                <div className="flex items-center mb-4">
                                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                                        <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                                    ))}
                                </div>
                                <p className="text-gray-600 mb-4">&quot;{testimonial.content}&quot;</p>
                                <div>
                                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                                    <div className="text-sm text-gray-600">{testimonial.role}, {testimonial.company}</div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
};

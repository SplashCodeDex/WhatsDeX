'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import Image from 'next/image';

const TESTIMONIALS = [
    {
        name: 'Sarah Jenkins',
        role: 'Head of Growth at FinTech Start',
        content: 'DeXMart completely transformed our customer acquisition. The WhatsApp bots answer 90% of basic queries instantly, letting our team focus on closing complex deals.',
        rating: 5,
        avatarInitials: 'SJ'
    },
    {
        name: 'David Chen',
        role: 'Operations Manager, RetailHub',
        content: 'Managing 10 different agent numbers used to be a nightmare. With the real-time sync and unified inbox, we have perfect visibility into all our store communications.',
        rating: 5,
        avatarInitials: 'DC'
    },
    {
        name: 'Elena Rodriguez',
        role: 'E-commerce Director',
        content: 'The automation rules are incredibly powerful. We set up an abandoned cart flow via WhatsApp that recovered 20% more sales in the first month alone.',
        rating: 5,
        avatarInitials: 'ER'
    }
];

export function SocialProof() {
    return (
        <section className="relative w-full py-24 md:py-32 overflow-hidden">
            {/* Background elements for liquid glass aesthetics */}
            <div className="absolute inset-0 -z-10 bg-background" />
            <div className="absolute right-0 top-1/4 -z-10 h-64 w-64 rounded-full bg-primary-500/10 blur-[100px]" />
            <div className="absolute left-0 bottom-1/4 -z-10 h-96 w-96 rounded-full bg-purple-500/10 blur-[120px]" />

            <div className="mx-auto max-w-6xl px-4">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
                        Loved by Industry Leaders
                    </h2>
                    <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                        Don&apos;t just take our word for it. See how DeXMart is driving extreme growth for businesses.
                    </p>
                </motion.div>

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {TESTIMONIALS.map((testimonial, idx) => (
                        <motion.div
                            key={testimonial.name}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-50px' }}
                            transition={{ duration: 0.5, delay: idx * 0.15 }}
                            whileHover={{ y: -5, scale: 1.02 }}
                            className="relative flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-md dark:border-white/5 dark:bg-black/20"
                        >
                            <Quote className="absolute right-6 top-6 h-12 w-12 text-primary-500/10" />
                            
                            <div className="mb-6 flex gap-1">
                                {[...Array(testimonial.rating)].map((_, i) => (
                                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                                ))}
                            </div>
                            
                            <p className="mb-8 relative z-10 font-medium text-foreground/90 leading-relaxed">
                                &quot;{testimonial.content}&quot;
                            </p>
                            
                            <div className="mt-auto flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-purple-600 text-sm font-bold text-white shadow-inner">
                                    {testimonial.avatarInitials}
                                </div>
                                <div>
                                    <h4 className="font-bold text-foreground">{testimonial.name}</h4>
                                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

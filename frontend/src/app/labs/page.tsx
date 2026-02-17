'use client';

import React from 'react';
import { GlassNavigation } from '@/components/ui/GlassNavigation/GlassNavigation';
import { motion } from 'framer-motion';
import { Beaker, ArrowLeft, Info } from 'lucide-react';
import Link from 'next/link';

export default function LabsPage() {
    return (
        <main className="relative min-h-screen bg-[#0a0a0c] text-white overflow-hidden selection:bg-purple-500/30">
            {/* Dynamic Background: Purple Ambient Glow */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[120px] rounded-full" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
            </div>

            {/* Header */}
            <header className="relative z-10 p-8 flex justify-between items-center border-b border-white/5 bg-black/20 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-600/20 border border-purple-500/30 rounded-xl shadow-lg shadow-purple-500/10">
                        <Beaker className="text-purple-400" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
                            DeX Labs
                        </h1>
                        <p className="text-xs text-gray-400 font-medium tracking-widest uppercase">Experimental Forge v1.0</p>
                    </div>
                </div>

                <Link
                    href="/"
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all active:scale-95 group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Exit Sandbox</span>
                </Link>
            </header>

            {/* Main Lab Bench */}
            <div className="relative z-10 max-w-7xl mx-auto p-12 grid grid-cols-1 lg:grid-cols-4 gap-12">
                {/* Left Panel: Component Metadata */}
                <div className="lg:col-span-1 space-y-6">
                    <section className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-sm">
                        <h2 className="flex items-center gap-2 text-sm font-semibold mb-4 text-purple-300">
                            <Info size={16} />
                            Active Experiment
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <p className="text-xl font-bold">Glass Navigation</p>
                                <p className="text-xs text-gray-500 mt-1">Status: <span className="text-green-400">Stable Build</span></p>
                            </div>
                            <p className="text-sm text-gray-400 leading-relaxed">
                                High-fidelity navigation system using SVG Displacement filters and Framer Motion layout transitions. Designed for premium SaaS dashboards.
                            </p>
                        </div>
                    </section>

                    <section className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-sm">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Tech Specs</h3>
                        <ul className="space-y-3 text-sm">
                            <li className="flex justify-between">
                                <span className="text-gray-500">Engine</span>
                                <span className="text-gray-300 font-mono text-xs">Framer Motion</span>
                            </li>
                            <li className="flex justify-between">
                                <span className="text-gray-500">Icons</span>
                                <span className="text-gray-300 font-mono text-xs">Lucide React</span>
                            </li>
                            <li className="flex justify-between">
                                <span className="text-gray-500">Aesthetics</span>
                                <span className="text-gray-300 font-mono text-xs">Glassmorphism</span>
                            </li>
                        </ul>
                    </section>
                </div>

                {/* Right Panel: The Stage */}
                <div className="lg:col-span-3 min-h-[600px] flex flex-col items-center justify-center rounded-[2.5rem] bg-gradient-to-b from-white/[0.05] to-transparent border border-white/10 relative overflow-hidden group shadow-2xl">
                    {/* Subtle Stage Lighting */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-gradient-radial from-white/[0.07] to-transparent pointer-events-none" />

                    <div className="relative z-20 space-y-12 flex flex-col items-center">
                        {/* Component Mounting Point */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="px-12 py-8 rounded-full bg-white/[0.02] border border-white/5 shadow-2xl relative"
                        >
                            <GlassNavigation />
                        </motion.div>

                        <div className="text-center space-y-2">
                            <p className="text-sm font-medium text-gray-500 italic">Interactivity Enabled</p>
                            <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em]">60 FPS Fluid Transitions</p>
                        </div>
                    </div>

                    {/* Background Grid (Blueprint style) */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
                </div>
            </div>

            <footer className="relative z-10 p-8 text-center border-t border-white/5 mt-12 bg-black/40">
                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.3em]">
                    Innovating at the edge of WhatsDeX Automation
                </p>
            </footer>
        </main>
    );
}

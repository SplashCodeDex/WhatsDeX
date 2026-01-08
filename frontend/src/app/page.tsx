'use client';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Bot,
  Play,
  Users,
  Shield,
  Globe,
  ArrowRight,
  HeadphonesIcon
} from 'lucide-react';

import { Hero } from '@/components/features/landing/Hero';
import { Features } from '@/components/features/landing/Features';
import { Pricing } from '@/components/features/landing/Pricing';
import { Testimonials } from '@/components/features/landing/Testimonials';

export default function LandingPage() {
  const stats = [
    { number: "99.9%", label: "Uptime Guarantee" },
    { number: "10M+", label: "Messages Processed" },
    { number: "500+", label: "Active Customers" },
    { number: "<2min", label: "Average Setup Time" }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Bot className="h-8 w-8 text-blue-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">WhatsDeX</span>
              <Badge className="ml-2 bg-green-100 text-green-800">SaaS Ready</Badge>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-blue-600">Features</a>
              <a href="#pricing" className="text-gray-700 hover:text-blue-600">Pricing</a>
              <a href="#demo" className="text-gray-700 hover:text-blue-600">Demo</a>
              <a href="/login" className="text-gray-700 hover:text-blue-600">Login</a>
              <Button onClick={() => window.location.href = '/register'}>Start Free Trial</Button>
            </div>
          </div>
        </div>
      </nav>

      <Hero />

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600">{stat.number}</div>
                <div className="text-gray-600 mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Features />

      {/* Demo Section */}
      <section id="demo" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              See It In Action
            </h2>
            <p className="text-xl text-gray-600">
              Experience the power of our multi-tenant WhatsApp platform
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Live Demo Access</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <Globe className="h-4 w-4 text-blue-600" />
                    </div>
                    <span>Demo URL: <code className="bg-gray-100 px-2 py-1 rounded">localhost:3000</code></span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <Users className="h-4 w-4 text-green-600" />
                    </div>
                    <span>Login: <code className="bg-gray-100 px-2 py-1 rounded">admin@demo.com</code></span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                      <Shield className="h-4 w-4 text-purple-600" />
                    </div>
                    <span>Password: <code className="bg-gray-100 px-2 py-1 rounded">password123</code></span>
                  </div>
                </div>
                <Button className="mt-6" size="lg" onClick={() => window.open('/login', '_blank')}>
                  <Play className="h-5 w-5 mr-2" />
                  Access Live Demo
                </Button>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-8 text-white">
                <h4 className="text-xl font-semibold mb-4">What You&apos;ll See:</h4>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <ArrowRight className="h-5 w-5 mr-2" />
                    Multi-tenant dashboard with real-time metrics
                  </li>
                  <li className="flex items-center">
                    <ArrowRight className="h-5 w-5 mr-2" />
                    WhatsApp bot creation and QR code generation
                  </li>
                  <li className="flex items-center">
                    <ArrowRight className="h-5 w-5 mr-2" />
                    Live message processing and analytics
                  </li>
                  <li className="flex items-center">
                    <ArrowRight className="h-5 w-5 mr-2" />
                    Subscription management and billing
                  </li>
                  <li className="flex items-center">
                    <ArrowRight className="h-5 w-5 mr-2" />
                    Team management and role assignments
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Pricing />

      <Testimonials />

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of businesses using WhatsDeX to automate their customer communications.
            Start your free trial today - no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-blue-600 hover:bg-gray-100"
              onClick={() => window.open('/register', '_blank')}
            >
              Start Free Trial
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-blue-600"
              onClick={() => alert('Contact us at sales@whatsdex.com or call +1-555-WHATSDX')}
            >
              <HeadphonesIcon className="h-5 w-5 mr-2" />
              Talk to Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Bot className="h-8 w-8 text-blue-400 mr-2" />
                <span className="text-xl font-bold">WhatsDeX</span>
              </div>
              <p className="text-gray-400">
                The complete WhatsApp automation platform for businesses of all sizes.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">API Docs</a></li>
                <li><a href="#" className="hover:text-white">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Status</a></li>
                <li><a href="#" className="hover:text-white">Security</a></li>
                <li><a href="#" className="hover:text-white">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 WhatsDeX. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

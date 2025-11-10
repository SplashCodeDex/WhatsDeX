'use client';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  MessageSquare, 
  Users, 
  Zap, 
  Shield, 
  TrendingUp,
  Check,
  Star,
  ArrowRight,
  Play,
  Globe,
  CreditCard,
  BarChart3,
  Smartphone,
  Clock,
  HeadphonesIcon
} from 'lucide-react';

export default function LandingPage() {
  const [selectedPlan, setSelectedPlan] = useState('basic');

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

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      description: 'Perfect for getting started',
      features: [
        '1 WhatsApp Bot',
        '3 Team Members',
        '100 Messages/month',
        '10 AI Requests/month',
        'Basic Support',
        'Web Dashboard'
      ],
      buttonText: 'Start Free',
      popular: false
    },
    {
      id: 'basic',
      name: 'Basic',
      price: 29.99,
      description: 'Great for small businesses',
      features: [
        '3 WhatsApp Bots',
        '10 Team Members',
        '5,000 Messages/month',
        '500 AI Requests/month',
        'Priority Support',
        'Analytics Dashboard',
        'Custom Branding',
        'API Access'
      ],
      buttonText: 'Start 14-day Trial',
      popular: true
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 99.99,
      description: 'Perfect for growing companies',
      features: [
        '10 WhatsApp Bots',
        '50 Team Members',
        '50,000 Messages/month',
        '5,000 AI Requests/month',
        'Advanced Analytics',
        'Webhook Integration',
        'Custom AI Training',
        'Multi-language Support',
        'White-label Options'
      ],
      buttonText: 'Start 14-day Trial',
      popular: false
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 299.99,
      description: 'For large organizations',
      features: [
        'Unlimited WhatsApp Bots',
        'Unlimited Team Members',
        'Unlimited Messages',
        'Unlimited AI Requests',
        'Dedicated Support',
        'Custom Integrations',
        'On-premise Deployment',
        'SLA Guarantee',
        'Advanced Security',
        'Custom Development'
      ],
      buttonText: 'Contact Sales',
      popular: false
    }
  ];

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

      {/* Hero Section */}
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

      {/* Features Section */}
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
                <h4 className="text-xl font-semibold mb-4">What You'll See:</h4>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 mr-2" />
                    Multi-tenant dashboard with real-time metrics
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 mr-2" />
                    WhatsApp bot creation and QR code generation
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 mr-2" />
                    Live message processing and analytics
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 mr-2" />
                    Subscription management and billing
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 mr-2" />
                    Team management and role assignments
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
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
                className={`relative border-2 transition-all hover:shadow-lg ${
                  plan.popular ? 'border-blue-500 shadow-lg' : 'border-gray-200'
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

      {/* Testimonials */}
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
                  <p className="text-gray-600 mb-4">"{testimonial.content}"</p>
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
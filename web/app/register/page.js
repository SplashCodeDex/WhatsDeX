'use client';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Check, ArrowRight, Bot, MessageSquare, Users, Zap } from 'lucide-react';

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
      'Basic Support'
    ],
    limitations: 'Limited features'
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
      'Custom Branding'
    ],
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
      'API Access',
      'Webhook Integration',
      'Custom AI Training'
    ]
  }
];

export default function Register() {
  const [formData, setFormData] = useState({
    companyName: '',
    subdomain: '',
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  const [selectedPlan, setSelectedPlan] = useState('basic');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    
    if (!formData.companyName) newErrors.companyName = 'Company name is required';
    if (!formData.subdomain) newErrors.subdomain = 'Subdomain is required';
    if (formData.subdomain && !/^[a-z0-9-]+$/.test(formData.subdomain)) {
      newErrors.subdomain = 'Only lowercase letters, numbers, and hyphens allowed';
    }
    if (!formData.email) newErrors.email = 'Email is required';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.name) newErrors.name = 'Your name is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          plan: selectedPlan
        })
      });

      const data = await response.json();

      if (data.success) {
        // Store auth token
        localStorage.setItem('auth_token', data.data.token);
        
        // Redirect to dashboard
        window.location.href = '/dashboard';
      } else {
        setErrors({ general: data.error });
      }
    } catch (error) {
      setErrors({ general: 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        {step === 1 && (
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <Bot className="h-8 w-8 text-blue-600 mr-2" />
                  <span className="text-2xl font-bold text-gray-900">WhatsDeX</span>
                </div>
                <CardTitle>Create Your Account</CardTitle>
                <CardDescription>
                  Start your WhatsApp automation journey today
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {errors.general && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                    {errors.general}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    placeholder="Your Company"
                    className={errors.companyName ? 'border-red-500' : ''}
                  />
                  {errors.companyName && (
                    <p className="text-red-500 text-sm">{errors.companyName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subdomain">Subdomain</Label>
                  <div className="flex">
                    <Input
                      id="subdomain"
                      name="subdomain"
                      value={formData.subdomain}
                      onChange={handleInputChange}
                      placeholder="yourcompany"
                      className={`rounded-r-none ${errors.subdomain ? 'border-red-500' : ''}`}
                    />
                    <div className="bg-gray-100 border border-l-0 px-3 py-2 rounded-r-md text-sm text-gray-600">
                      .whatsdx.com
                    </div>
                  </div>
                  {errors.subdomain && (
                    <p className="text-red-500 text-sm">{errors.subdomain}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="you@company.com"
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Your Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1234567890"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className={errors.password ? 'border-red-500' : ''}
                  />
                  {errors.password && (
                    <p className="text-red-500 text-sm">{errors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className={errors.confirmPassword ? 'border-red-500' : ''}
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
                  )}
                </div>

                <Button onClick={handleNext} className="w-full">
                  Next Step
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>

                <div className="text-center text-sm text-gray-600">
                  Already have an account?{' '}
                  <a href="/login" className="text-blue-600 hover:underline">
                    Sign in
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Plan</h1>
              <p className="text-gray-600">
                Select the perfect plan for your business needs
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {plans.map((plan) => (
                <Card 
                  key={plan.id} 
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedPlan === plan.id 
                      ? 'ring-2 ring-blue-500 shadow-lg' 
                      : 'hover:shadow-md'
                  } ${plan.popular ? 'border-blue-500' : ''}`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      {plan.popular && (
                        <Badge className="bg-blue-500">Most Popular</Badge>
                      )}
                    </div>
                    <div className="text-3xl font-bold">
                      ${plan.price}
                      <span className="text-sm font-normal text-gray-600">/month</span>
                    </div>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm">
                          <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    {plan.limitations && (
                      <p className="text-xs text-gray-500 mt-4">{plan.limitations}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-center space-x-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={handleRegister} disabled={loading} className="px-8">
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </Button>
            </div>

            <div className="text-center mt-6 text-sm text-gray-600">
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
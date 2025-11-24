'use client';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '../../hooks/use-toast';
import { Check, ArrowRight, Bot, MessageSquare, Users, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../lib/apiClient';
import { useRouter } from 'next/navigation';

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
  const [availability, setAvailability] = useState({ email: null, subdomain: null });
  const prevAvailRef = useRef({ email: null, subdomain: null });
  const [checking, setChecking] = useState({ email: false, subdomain: false });
  const { register } = useAuth();
  const router = useRouter();

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  let debounceTimer;
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

    // Debounced availability check for email and subdomain
    if (name === 'email' || name === 'subdomain') {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        try {
          setChecking(prev => ({ ...prev, [name]: true }));
          const params = { [name]: value };
          const data = await apiClient.checkAvailability(params);

          if (name === 'email' && value === formData.email) {
            const newEmailAvail = data.email || { available: true };
            setAvailability(prev => ({ ...prev, email: newEmailAvail }));
            const isAvailable = !!newEmailAvail.available;
            if (prevAvailRef.current.email !== isAvailable) {
              if (isAvailable) {
                toast({ title: 'Email available', description: 'You can use this email', variant: 'success' });
              } else {
                toast({ title: 'Email in use', description: newEmailAvail.reason || 'Email already registered', variant: 'destructive' });
              }
              prevAvailRef.current.email = isAvailable;
            }
            if (!isAvailable) {
              setErrors(prev => ({ ...prev, email: newEmailAvail.reason || 'Email not available' }));
            }
          }
          if (name === 'subdomain' && value === formData.subdomain) {
            const newSubAvail = data.subdomain || { available: true };
            setAvailability(prev => ({ ...prev, subdomain: newSubAvail }));
            const isAvailable = !!newSubAvail.available;
            if (prevAvailRef.current.subdomain !== isAvailable) {
              if (isAvailable) {
                toast({ title: 'Subdomain available', description: 'Nice choice — it’s available', variant: 'success' });
              } else {
                toast({ title: 'Subdomain taken', description: newSubAvail.reason || 'Please try another subdomain', variant: 'destructive' });
              }
              prevAvailRef.current.subdomain = isAvailable;
            }
            if (!isAvailable) {
              setErrors(prev => ({ ...prev, subdomain: newSubAvail.reason || 'Subdomain not available' }));
            }
          }
        } catch (err) {
          console.error('Availability check failed', err);
        } finally {
          setChecking(prev => ({ ...prev, [name]: false }));
        }
      }, 500);
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

  const handleNext = async () => {
    if (!validateStep1()) {
      scrollToTop();
      return;
    }

    // Ensure availability before proceeding
    try {
      setChecking(prev => ({ ...prev, email: true, subdomain: true }));
      const params = { email: formData.email, subdomain: formData.subdomain };
      const data = await apiClient.checkAvailability(params);

      const newErrors = {};
      if (data.email && data.email.available === false) newErrors.email = data.email.reason || 'Email not available';
      if (data.subdomain && data.subdomain.available === false) newErrors.subdomain = data.subdomain.reason || 'Subdomain not available';
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        toast({ title: 'Please fix the highlighted fields', description: 'Some details are not available yet', variant: 'destructive' });
        scrollToTop();
        return;
      } else {
        toast({ title: 'Looks good!', description: 'Email and subdomain are available. Choose your plan.', variant: 'success' });
      }
      setStep(2);
      scrollToTop();
    } catch (e) {
      // fallback: allow step but warn
      setStep(2);
      scrollToTop();
    } finally {
      setChecking(prev => ({ ...prev, email: false, subdomain: false }));
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setErrors({});

    const result = await register({
      ...formData,
      tenantName: formData.companyName,
      plan: selectedPlan
    });

    if (result.success) {
      router.push('/dashboard');
    } else {
      // Map server error to field-specific errors when provided
      // Note: The backend might return different error structures, so we handle generic ones here
      const newErrors = { general: result.error };
      setErrors(newErrors);
      // Jump user back to step 1 if error concerns inputs
      setStep(1);
      scrollToTop();
      toast({ title: 'Could not create account', description: result.error || 'Please review your information', variant: 'destructive' });
    }
    setLoading(false);
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
                  <div className="flex items-center">
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
                  <div className="flex items-center gap-2 mt-1 text-sm">
                    {checking.subdomain && <span className="text-gray-500">Checking availability…</span>}
                    {availability.subdomain && availability.subdomain.available && !checking.subdomain && !errors.subdomain && (
                      <span className="text-green-600">Subdomain is available</span>
                    )}
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
                  <div className="flex items-center gap-2 mt-1 text-sm">
                    {checking.email && <span className="text-gray-500">Checking availability…</span>}
                    {availability.email && availability.email.available && !checking.email && !errors.email && (
                      <span className="text-green-600">Email is available</span>
                    )}
                  </div>
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

                <Button onClick={handleNext} className="w-full" disabled={checking.email || checking.subdomain}>
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
                  className={`cursor-pointer transition-all duration-200 ${selectedPlan === plan.id
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

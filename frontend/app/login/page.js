'use client';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '../../hooks/use-toast';
import { Bot, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Extract subdomain from hostname
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      // Assuming format: subdomain.domain.com or subdomain.localhost
      const parts = hostname.split('.');
      if (parts.length > 2) {
        setSubdomain(parts[0]);
      }
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(email, password, subdomain);

    if (result.success) {
      toast({
        title: 'Welcome back!',
        description: 'Successfully logged in.',
        variant: 'success'
      });
      router.push('/dashboard');
    } else {
      toast({
        title: 'Login failed',
        description: result.error,
        variant: 'destructive'
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Bot className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Sign in to manage your WhatsApp bots</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <a href="#" className="text-sm text-blue-600 hover:underline">
                  Forgot password?
                </a>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <div className="flex items-center">
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>

              <div className="text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <a href="/register" className="text-blue-600 hover:underline">
                  Start free trial
                </a>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Demo credentials */}
        <Card className="mt-4 bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm font-medium text-blue-800 mb-2">Demo Account</p>
              <p className="text-xs text-blue-600">
                Subdomain: <span className="font-mono">demo</span><br />
                Email: <span className="font-mono">admin@demo.com</span><br />
                Password: <span className="font-mono">password123</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

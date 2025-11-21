'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Bot, MessageSquare, Crown, ArrowRight } from 'lucide-react';

export default function OnboardingCompletePage() {
  const [botInfo, setBotInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadBotInfo = async () => {
      const botInstanceId = localStorage.getItem('botInstanceId');
      const selectedPlan = localStorage.getItem('selectedPlan');
      
      if (!botInstanceId) {
        router.push('/onboarding');
        return;
      }

      try {
        const response = await fetch(`/api/bots/${botInstanceId}`);
        if (response.ok) {
          const bot = await response.json();
          setBotInfo({ ...bot, plan: selectedPlan });
        }
      } catch (error) {
        console.error('Error loading bot info:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBotInfo();
  }, [router]);

  const handleGoToDashboard = () => {
    // Clear onboarding data
    localStorage.removeItem('selectedPlan');
    localStorage.removeItem('botInstanceId');
    
    // Redirect to dashboard
    router.push('/dashboard');
  };

  const handleTestBot = () => {
    // You could open a modal or redirect to test interface
    alert('Send a message to your WhatsApp number to test the bot!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Bot className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading your bot information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="p-6 bg-green-100 rounded-full">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎉 Congratulations!
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your WhatsApp bot is now live and ready to serve your customers 24/7
          </p>
        </div>

        {botInfo && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bot className="h-6 w-6 text-blue-600" />
                <span>Your Bot Details</span>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </CardTitle>
              <CardDescription>
                Here's a summary of your newly created bot
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Bot Name</p>
                  <p className="text-lg font-semibold">{botInfo.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Plan</p>
                  <div className="flex items-center space-x-2">
                    <Crown className="h-4 w-4 text-yellow-500" />
                    <span className="font-semibold">{botInfo.plan || 'FREE'} Plan</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <Badge className="bg-green-100 text-green-800">Connected</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone Number</p>
                  <p className="font-semibold">{botInfo.phoneNumber || 'Auto-assigned'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Next Steps</span>
              </CardTitle>
              <CardDescription>
                Get the most out of your bot
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Send a test message to your WhatsApp</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Customize your bot's responses</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Add your bot to groups</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Monitor analytics and performance</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Start using your bot right away
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleTestBot}
                variant="outline"
                className="w-full justify-start"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Test Your Bot
              </Button>
              <Button
                onClick={() => router.push('/dashboard/analytics')}
                variant="outline"
                className="w-full justify-start"
              >
                <Bot className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
              <Button
                onClick={() => router.push('/dashboard/settings')}
                variant="outline"
                className="w-full justify-start"
              >
                <Crown className="h-4 w-4 mr-2" />
                Customize Settings
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="bg-blue-50 rounded-lg p-6 mb-8">
          <div className="flex items-start space-x-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bot className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Pro Tip!</h3>
              <p className="text-blue-800 mb-3">
                Send the command "menu" to your bot to see all available features. You can also type "help" 
                to get assistance at any time.
              </p>
              <p className="text-sm text-blue-700">
                Your bot will respond automatically to messages even when you're offline!
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Button
            onClick={handleGoToDashboard}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
          >
            Go to Dashboard
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>

        <div className="text-center mt-6 text-gray-600">
          <p>Need help? Check out our documentation or contact support anytime.</p>
        </div>
      </div>
    </div>
  );
}
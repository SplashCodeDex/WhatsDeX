'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bot, ArrowLeft, ArrowRight } from 'lucide-react';

export default function CreateBotPage() {
  const [botName, setBotName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const plan = localStorage.getItem('selectedPlan');
    if (!plan) {
      router.push('/onboarding');
      return;
    }
    setSelectedPlan(plan);
  }, [router]);

  const { tenant } = useAuth();

  const handleCreateBot = async () => {
    if (!botName.trim()) {
      setError('Please enter a bot name');
      return;
    }

    if (!tenant?.id) {
      setError('Tenant information missing. Please try logging in again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const bot = await apiClient.createBot(tenant.id, {
        name: botName,
        phoneNumber: phoneNumber || undefined
      });

      // Store bot ID and proceed to template selection
      localStorage.setItem('botInstanceId', bot.id);
      router.push('/onboarding/select-template');
    } catch (error) {
      console.error('Error creating bot:', error);
      setError(error.message || 'Failed to create bot. Please try again.');
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/onboarding');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-blue-100 rounded-full">
              <Bot className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Your Bot
          </h1>
          <p className="text-gray-600">
            Set up your WhatsApp bot with a custom name and optional phone number
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bot Configuration</CardTitle>
            <CardDescription>
              Choose a name for your bot and optionally specify a phone number preference
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedPlan && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Selected Plan:</strong> {selectedPlan} Plan
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="botName">Bot Name *</Label>
              <Input
                id="botName"
                placeholder="e.g., MyBusiness Assistant, Support Bot, etc."
                value={botName}
                onChange={(e) => setBotName(e.target.value)}
                className="w-full"
              />
              <p className="text-sm text-gray-500">
                This name will be displayed in your dashboard and can be changed later
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
              <Input
                id="phoneNumber"
                placeholder="e.g., +1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full"
              />
              <p className="text-sm text-gray-500">
                Leave blank to use any available number. You'll scan a QR code to connect.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Plans
              </Button>

              <Button
                onClick={handleCreateBot}
                disabled={loading || !botName.trim()}
                className="flex items-center"
              >
                {loading ? 'Creating...' : 'Create Bot'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-gray-600">
          <p>After creating your bot, you'll select a template and connect via QR code</p>
        </div>
      </div>
    </div>
  );
}

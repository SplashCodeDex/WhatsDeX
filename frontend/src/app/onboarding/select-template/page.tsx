'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Users, Headphones, Store, ArrowLeft, ArrowRight } from 'lucide-react';
import { useBots } from '@/hooks/useBots';
import { useAuth } from '@/contexts/AuthContext';



export default function SelectTemplatePage() {
  const [selectedTemplate, setSelectedTemplate] = useState('welcome');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [botInstanceId] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('botInstanceId') || '';
    }
    return '';
  });
  const router = useRouter();
  const { tenant } = useAuth();
  const { applyTemplate, fetchTemplates, templates, loading: botsLoading } = useBots(tenant?.id || '');

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  useEffect(() => {
    if (!botInstanceId && typeof window !== 'undefined') {
      router.push('/onboarding/create-bot');
    }
  }, [botInstanceId, router]);

  const handleTemplateSelect = async () => {
    if (!selectedTemplate || !botInstanceId) {
      setError('Please select a template');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await applyTemplate(botInstanceId, selectedTemplate);

      // Proceed to QR pairing
      router.push('/onboarding/pair-whatsapp');
    } catch (error: any) {
      console.error('Error applying template:', error);
      setError(error.message || 'Failed to apply template. Please try again.');
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/onboarding/create-bot');
  };

  const selectedTemplateData = templates.find(t => t.id === selectedTemplate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Choose a Template
          </h1>
          <p className="text-gray-600">
            Select a template that matches your business needs. You can customize it later.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Template Selection */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Available Templates</h2>
            {templates && templates.map((template: any) => {
              const Icon = template.icon === 'MessageSquare' ? MessageSquare :
                template.icon === 'Headphones' ? Headphones :
                  template.icon === 'Store' ? Store :
                    template.icon === 'Users' ? Users : MessageSquare;
              const isSelected = selectedTemplate === template.id;

              return (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''
                    }`}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}`}>
                          <Icon className={`h-6 w-6 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <CardDescription className="text-sm mt-1">
                            {template.description}
                          </CardDescription>
                        </div>
                      </div>
                      {template.popular && (
                        <Badge className="bg-green-100 text-green-800">Popular</Badge>
                      )}
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Preview</h2>
            {selectedTemplateData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {React.createElement(selectedTemplateData.icon, { className: "h-5 w-5" })}
                    <span>{selectedTemplateData.name}</span>
                  </CardTitle>
                  <CardDescription>Template Preview</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Welcome Message Preview */}
                  <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-400">
                    <p className="text-sm font-medium text-green-800 mb-1">Welcome Message:</p>
                    <p className="text-green-700">{selectedTemplateData.welcomeMessage}</p>
                  </div>

                  {/* Menu Items Preview */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Menu Options:</p>
                    <div className="space-y-2">
                      {selectedTemplateData.menuItems.map((item: any, index: number) => (
                        <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                          <span className="font-medium">{item.label}</span>
                          <span className="text-gray-500 ml-2">
                            ({item.actionType === 'reply' ? 'Auto Reply' :
                              item.actionType === 'link' ? 'Link' : 'Command'})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6 max-w-2xl mx-auto">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="flex justify-between mt-8 max-w-2xl mx-auto">
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Bot Setup
          </Button>

          <Button
            onClick={handleTemplateSelect}
            disabled={loading || !selectedTemplate}
            className="flex items-center"
          >
            {loading ? 'Applying...' : 'Apply Template'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

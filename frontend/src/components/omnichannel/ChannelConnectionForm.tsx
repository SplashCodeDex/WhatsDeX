'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Send, Hash, Slack, ShieldCheck, Loader2 } from 'lucide-react';

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { useOmnichannelStore } from '@/stores/useOmnichannelStore';
import { toast } from 'sonner';

interface ChannelConnectionFormProps {
  type: 'telegram' | 'discord' | 'slack' | 'whatsapp';
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ChannelConnectionForm({ type, onSuccess, onCancel }: ChannelConnectionFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const { fetchChannels } = useOmnichannelStore();

  const config = {
    whatsapp: {
      title: 'Connect WhatsApp',
      description: 'Initialize a new WhatsApp instance',
      icon: Send,
      color: 'text-green-500',
      fields: [{ id: 'name', label: 'Bot Name', placeholder: 'My WhatsApp Bot' }]
    },
    telegram: {
      title: 'Connect Telegram Bot',
      description: 'Enter your bot token from @BotFather',
      icon: Send,
      color: 'text-blue-400',
      fields: [
        { id: 'name', label: 'Bot Name', placeholder: 'My Telegram Bot' },
        { id: 'token', label: 'Bot Token', placeholder: '123456789:ABCdef...' }
      ]
    },
    discord: {
      title: 'Connect Discord Bot',
      description: 'Enter your bot token and application ID from Discord Developer Portal',
      icon: Hash,
      color: 'text-indigo-500',
      fields: [
        { id: 'name', label: 'Bot Name', placeholder: 'My Discord Bot' },
        { id: 'token', label: 'Bot Token', placeholder: 'OTQ...' }
      ]
    },
    slack: {
      title: 'Connect Slack App',
      description: 'Enter your Bot User OAuth Token',
      icon: Slack,
      color: 'text-purple-500',
      fields: [
        { id: 'name', label: 'Bot Name', placeholder: 'My Slack Bot' },
        { id: 'token', label: 'xoxb- Token', placeholder: 'xoxb-...' }
      ]
    }
  }[type];

  const Icon = config.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create Bot Instance
      const createResponse = await api.post<any>(API_ENDPOINTS.BOTS.CREATE, {
        name: formData.name,
        type: type,
        credentials: formData.token ? { token: formData.token } : undefined,
        status: 'disconnected'
      });

      if (!createResponse.success) {
        throw new Error(createResponse.error.message);
      }

      const bot = createResponse.data;
      toast.success('Bot instance created. Starting connection...');

      // 2. Trigger Connection
      const connectResponse = await api.post<any>(API_ENDPOINTS.BOTS.CONNECT(bot.id), {});

      if (!connectResponse.success) {
        throw new Error(connectResponse.error.message);
      }

      // Refresh local channels to show the new card in "connecting" state
      await fetchChannels();

      onSuccess?.();
    } catch (err: any) {
      toast.error(`Connection failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (id: string, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  return (
    <Card className="w-full max-w-md shadow-lg border-primary/10">
      <CardHeader>
        <div className="flex items-center space-x-2 mb-2">
          <Icon className={config.color} />
          <CardTitle>{config.title}</CardTitle>
        </div>
        <CardDescription>{config.description}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {config.fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.id}>{field.label}</Label>
              <Input
                id={field.id}
                placeholder={field.placeholder}
                value={formData[field.id] || ''}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
                required
                className="bg-background/50"
              />
            </div>
          ))}
          <div className="rounded-lg bg-muted/50 p-3 flex items-start space-x-2">
            <ShieldCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              Your credentials are encrypted and stored securely. WhatsDeX never logs sensitive tokens.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Connect Channel
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

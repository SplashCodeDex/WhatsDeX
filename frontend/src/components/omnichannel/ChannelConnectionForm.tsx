'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slack, ShieldCheck, Loader2, MessageSquare, Hash, UserCircle2 } from 'lucide-react';
import { SiWhatsapp, SiTelegram, SiDiscord, SiSignal, SiGooglechat } from 'react-icons/si';
import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { useOmnichannelStore } from '@/stores/useOmnichannelStore';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface ChannelConnectionFormProps {
  type: 'whatsapp' | 'telegram' | 'discord' | 'slack' | 'signal' | 'imessage' | 'irc' | 'googlechat';
  agentId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ChannelConnectionForm({ type, agentId: initialAgentId, onSuccess, onCancel }: ChannelConnectionFormProps) {
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [selectedAgentId, setSelectedAgentId] = useState(initialAgentId || 'system_default');
  const { fetchChannels, fetchAgents, agentsResult } = useOmnichannelStore();

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const agents = agentsResult?.agents || [];

  const config = {
    whatsapp: {
      title: 'Connect WhatsApp',
      description: 'Create a WhatsApp channel instance. You will link your device using a QR code or pairing code next.',
      icon: SiWhatsapp,
      color: 'text-green-500',
      fields: []
    },
    telegram: {
      title: 'Connect Telegram Bot',
      description: 'Enter your bot token from @BotFather',
      icon: SiTelegram,
      color: 'text-blue-400',
      fields: [{ id: 'token', label: 'Bot Token', placeholder: '123456789:ABCdef...' }]
    },
    discord: {
      title: 'Connect Discord Bot',
      description: 'Enter your bot token and application ID from Discord Developer Portal',
      icon: SiDiscord,
      color: 'text-indigo-500',
      fields: [
        { id: 'token', label: 'Bot Token', placeholder: 'OTQ...' },
        { id: 'appId', label: 'Application ID', placeholder: '94...' }
      ]
    },
    slack: {
      title: 'Connect Slack App',
      description: 'Enter your Bot User OAuth Token',
      icon: Slack,
      color: 'text-purple-500',
      fields: [{ id: 'token', label: 'xoxb- Token', placeholder: 'xoxb-...' }]
    },
    signal: {
      title: 'Connect Signal',
      description: 'Enter your Signal phone number (with country code)',
      icon: SiSignal,
      color: 'text-blue-600',
      fields: [{ id: 'phone', label: 'Phone Number', placeholder: '+1234567890' }]
    },
    imessage: {
      title: 'Connect iMessage',
      description: 'Enter your Apple ID or Phone Number associated with iMessage',
      icon: MessageSquare,
      color: 'text-blue-400',
      fields: [{ id: 'identifier', label: 'Identifier', placeholder: 'user@example.com or +123...' }]
    },
    irc: {
      title: 'Connect IRC',
      description: 'Enter your IRC server and nickname details',
      icon: Hash,
      color: 'text-gray-500',
      fields: [
        { id: 'server', label: 'Server', placeholder: 'irc.libera.chat' },
        { id: 'nick', label: 'Nickname', placeholder: 'DeXMartBot' }
      ]
    },
    googlechat: {
      title: 'Connect Google Chat',
      description: 'Enter your Google Chat Space ID and credentials',
      icon: SiGooglechat,
      color: 'text-yellow-500',
      fields: [
        { id: 'spaceId', label: 'Space ID', placeholder: 'spaces/...' },
        { id: 'token', label: 'Access Token / Webhook', placeholder: '...' }
      ]
    }
  }[type];

  const Icon = config.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post(API_ENDPOINTS.OMNICHANNEL.AGENTS.CHANNELS.CREATE(selectedAgentId), {
        type,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Channel`,
        credentials
      });

      if (response.success) {
        toast.success(`Connection initiated for ${type}. Check the hub for status.`);
        await fetchChannels(selectedAgentId);
        onSuccess?.();
      } else {
        toast.error(response.error.message || 'Failed to connect channel');
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg border-primary/10 bg-card text-foreground">
      <CardHeader>
        <div className="flex items-center space-x-2 mb-2">
          <Icon className={cn("h-6 w-6", config.color)} />
          <CardTitle>{config.title}</CardTitle>
        </div>
        <CardDescription>{config.description}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agent-select" className="text-xs uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-2">
              <UserCircle2 className="h-3 w-3" />
              Assign to Agent
            </Label>
            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
              <SelectTrigger id="agent-select" className="bg-background/50">
                <SelectValue placeholder="Select an Agent" />
              </SelectTrigger>
              <SelectContent>
                {agents.length === 0 ? (
                  <SelectItem value="system_default">System Default Agent</SelectItem>
                ) : (
                  agents.map((agent: any) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">
              The agent provides the "brain" and intelligence for this connectivity slot.
            </p>
          </div>

          {config.fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.id}>{field.label}</Label>
              <Input
                id={field.id}
                placeholder={field.placeholder}
                value={credentials[field.id] || ''}
                onChange={(e) => setCredentials({ ...credentials, [field.id]: e.target.value })}
                required
                className="bg-background/50"
              />
            </div>
          ))}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="ghost" onClick={onCancel}>
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

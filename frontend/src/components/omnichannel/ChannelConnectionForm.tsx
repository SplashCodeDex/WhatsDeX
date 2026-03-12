'use client';

import { Slack, ShieldCheck, Loader2, MessageSquare, Hash, UserCircle2, QrCode, KeyRound } from 'lucide-react';
import { useState, useEffect } from 'react';
import { SiWhatsapp, SiTelegram, SiDiscord, SiSignal, SiGooglechat } from 'react-icons/si';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { cn } from '@/lib/utils';
import { useOmnichannelStore } from '@/stores/useOmnichannelStore';

interface ChannelConnectionFormProps {
  type: 'whatsapp' | 'telegram' | 'discord' | 'slack' | 'signal' | 'imessage' | 'irc' | 'googlechat';
  agentId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ChannelConnectionForm({ type, agentId: initialAgentId, onSuccess, onCancel }: ChannelConnectionFormProps) {
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [connectionMethod, setConnectionMethod] = useState<'qr' | 'pairing'>('qr');
  const [selectedAgentId, setSelectedAgentId] = useState(initialAgentId || 'system_default');
  const { fetchAllChannels, fetchAgents, agentsResult } = useOmnichannelStore();

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
      const payload: any = {
        type,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Channel`,
        credentials
      };

      // Add connection method for WhatsApp
      if (type === 'whatsapp') {
        payload.metadata = { connectionMethod };
        if (connectionMethod === 'pairing' && credentials.phone) {
          payload.phoneNumber = credentials.phone;
        }
      }

      const response = await api.post(API_ENDPOINTS.OMNICHANNEL.AGENTS.CHANNELS.CREATE(selectedAgentId), payload);

      if (response.success) {
        toast.success(`Connection initiated for ${type}. Check the hub for status.`);
        await fetchAllChannels();
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
    <Card className="w-full max-w-md shadow-lg border-primary/10 bg-card text-foreground overflow-hidden">
      <CardHeader className="bg-muted/30 pb-6 border-b border-border/50">
        <div className="flex items-center space-x-3 mb-2">
          <div className={cn("p-2 rounded-lg bg-background border border-border/50 shadow-sm")}>
            <Icon className={cn("h-6 w-6", config.color)} />
          </div>
          <div>
            <CardTitle className="text-xl">{config.title}</CardTitle>
            <CardDescription className="text-xs">{config.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-2">
            <Label htmlFor="agent-select" className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-2">
              <UserCircle2 className="h-3 w-3" />
              Assign to Agent
            </Label>
            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
              <SelectTrigger id="agent-select" className="bg-background/50 border-border/50">
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
            <p className="text-[10px] text-muted-foreground italic">
              The agent provides the "brain" and intelligence for this connectivity slot.
            </p>
          </div>

          {/* WhatsApp Specific Connection Method */}
          {type === 'whatsapp' && (
            <div className="space-y-4 pt-4 border-t border-border/50">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-2">
                <ShieldCheck className="h-3 w-3" />
                Connection Method
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setConnectionMethod('qr')}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-2",
                    connectionMethod === 'qr'
                      ? "bg-primary/10 border-primary text-primary shadow-sm"
                      : "bg-background border-border/50 text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  <QrCode className="h-5 w-5" />
                  <span className="text-[10px] font-bold">QR Code</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConnectionMethod('pairing')}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-2",
                    connectionMethod === 'pairing'
                      ? "bg-primary/10 border-primary text-primary shadow-sm"
                      : "bg-background border-border/50 text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  <KeyRound className="h-5 w-5" />
                  <span className="text-[10px] font-bold">Pairing Code</span>
                </button>
              </div>

              {connectionMethod === 'pairing' && (
                <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <Label htmlFor="phone" className="text-xs">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="+1234567890"
                    value={credentials.phone || ''}
                    onChange={(e) => setCredentials({ ...credentials, phone: e.target.value })}
                    required
                    className="bg-background/50 border-border/50 h-9"
                  />
                  <p className="text-[10px] text-muted-foreground italic">
                    Include country code (e.g. +1). You will receive a code on your mobile device.
                  </p>
                </div>
              )}
            </div>
          )}

          {config.fields.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-border/50">
              {config.fields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={field.id} className="text-xs">{field.label}</Label>
                  <Input
                    id={field.id}
                    placeholder={field.placeholder}
                    value={credentials[field.id] || ''}
                    onChange={(e) => setCredentials({ ...credentials, [field.id]: e.target.value })}
                    required
                    className="bg-background/50 border-border/50 h-9"
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between bg-muted/20 border-t border-border/50 py-4">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={loading} className="font-bold">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Connect Channel
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

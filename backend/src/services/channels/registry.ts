import { type ChannelAdapter } from "./ChannelAdapter.js";
import { WhatsappAdapter } from "./whatsapp/WhatsappAdapter.js";
import { TelegramAdapter } from "./telegram/TelegramAdapter.js";
import { DiscordAdapter } from "./discord/DiscordAdapter.js";
import { SlackAdapter } from "./slack/SlackAdapter.js";
import { SignalAdapter } from "./signal/SignalAdapter.js";
import { IMessageAdapter } from "./imessage/IMessageAdapter.js";
import { IRCAdapter } from "./irc/IRCAdapter.js";
import { GoogleChatAdapter } from "./googlechat/GoogleChatAdapter.js";

export interface PlatformField {
  id: string;
  label: string;
  placeholder: string;
  type?: 'text' | 'password' | 'number';
}

export interface PlatformMetadata {
  id: string;
  label: string;
  description: string;
  icon: string; // Icon name for the frontend to map
  color: string; // CSS color class
  fields: PlatformField[];
}

export interface PlatformRegistryEntry {
  metadata: PlatformMetadata;
  adapterClass: any;
}

const REGISTRY: Record<string, PlatformRegistryEntry> = {
  whatsapp: {
    metadata: {
      id: 'whatsapp',
      label: 'WhatsApp',
      description: 'Create a WhatsApp channel instance. You will link your device using a QR code or pairing code next.',
      icon: 'SiWhatsapp',
      color: 'bg-green-500',
      fields: [
        { id: 'deviceName', label: 'Device Name (Shows on Linked Devices)', placeholder: 'e.g., Acme Corp Support' }
      ]
    },
    adapterClass: WhatsappAdapter
  },
  telegram: {
    metadata: {
      id: 'telegram',
      label: 'Telegram',
      description: 'Enter your bot token from @BotFather',
      icon: 'SiTelegram',
      color: 'bg-blue-400',
      fields: [{ id: 'token', label: 'Bot Token', placeholder: '123456789:ABCdef...' }]
    },
    adapterClass: TelegramAdapter
  },
  discord: {
    metadata: {
      id: 'discord',
      label: 'Discord',
      description: 'Enter your bot token and application ID from Discord Developer Portal',
      icon: 'SiDiscord',
      color: 'bg-indigo-500',
      fields: [
        { id: 'token', label: 'Bot Token', placeholder: 'OTQ...' },
        { id: 'appId', label: 'Application ID', placeholder: '94...' }
      ]
    },
    adapterClass: DiscordAdapter
  },
  slack: {
    metadata: {
      id: 'slack',
      label: 'Slack',
      description: 'Enter your Bot User OAuth Token',
      icon: 'Slack',
      color: 'bg-purple-500',
      fields: [{ id: 'token', label: 'xoxb- Token', placeholder: 'xoxb-...' }]
    },
    adapterClass: SlackAdapter
  },
  signal: {
    metadata: {
      id: 'signal',
      label: 'Signal',
      description: 'Enter your Signal phone number (with country code)',
      icon: 'SiSignal',
      color: 'bg-blue-600',
      fields: [{ id: 'phone', label: 'Phone Number', placeholder: '+1234567890' }]
    },
    adapterClass: SignalAdapter
  },
  imessage: {
    metadata: {
      id: 'imessage',
      label: 'iMessage',
      description: 'Enter your Apple ID or Phone Number associated with iMessage',
      icon: 'MessageSquare',
      color: 'bg-blue-400',
      fields: [{ id: 'identifier', label: 'Identifier', placeholder: 'user@example.com or +123...' }]
    },
    adapterClass: IMessageAdapter
  },
  irc: {
    metadata: {
      id: 'irc',
      label: 'IRC',
      description: 'Enter your IRC server and nickname details',
      icon: 'Hash',
      color: 'bg-gray-500',
      fields: [
        { id: 'server', label: 'Server', placeholder: 'irc.libera.chat' },
        { id: 'nick', label: 'Nickname', placeholder: 'DeXMartBot' }
      ]
    },
    adapterClass: IRCAdapter
  },
  googlechat: {
    metadata: {
      id: 'googlechat',
      label: 'Google Chat',
      description: 'Enter your Google Chat Space ID and credentials',
      icon: 'SiGooglechat',
      color: 'bg-yellow-500',
      fields: [
        { id: 'spaceId', label: 'Space ID', placeholder: 'spaces/...' },
        { id: 'token', label: 'Access Token / Webhook', placeholder: '...' }
      ]
    },
    adapterClass: GoogleChatAdapter
  }
};

export function getSupportedPlatforms(): PlatformMetadata[] {
  return Object.values(REGISTRY).map(entry => entry.metadata);
}

export function getPlatformAdapter(type: string): any | undefined {
  return REGISTRY[type]?.adapterClass;
}

export function getPlatformMetadata(type: string): PlatformMetadata | undefined {
  return REGISTRY[type]?.metadata;
}

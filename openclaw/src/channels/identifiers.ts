export const CHAT_CHANNEL_ORDER = [
  "telegram",
  "whatsapp",
  "discord",
  "irc",
  "googlechat",
  "slack",
  "signal",
  "imessage",
] as const;

export type ChatChannelId = (typeof CHAT_CHANNEL_ORDER)[number];

export const CHANNEL_IDS = [...CHAT_CHANNEL_ORDER] as const;

export const CHAT_CHANNEL_ALIASES: Record<string, ChatChannelId> = {
  imsg: "imessage",
  "internet-relay-chat": "irc",
  "google-chat": "googlechat",
  gchat: "googlechat",
};

const normalizeChannelKey = (raw?: string | null): string | undefined => {
  const normalized = raw?.trim().toLowerCase();
  return normalized || undefined;
};

export function normalizeChatChannelId(raw?: string | null): ChatChannelId | null {
  const normalized = normalizeChannelKey(raw);
  if (!normalized) {
    return null;
  }
  const resolved = CHAT_CHANNEL_ALIASES[normalized] ?? normalized;
  return CHAT_CHANNEL_ORDER.includes(resolved as any) ? (resolved as ChatChannelId) : null;
}

export function normalizeChannelId(raw?: string | null): ChatChannelId | null {
  return normalizeChatChannelId(raw);
}

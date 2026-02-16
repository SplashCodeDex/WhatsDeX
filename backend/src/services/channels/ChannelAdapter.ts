/**
 * ChannelAdapter is the base interface for all messaging channel adapters
 * in WhatsDeX. It follows the pattern established by OpenClaw but is
 * tailored for WhatsDeX's multi-tenant architecture.
 */
export interface ChannelAdapter {
  /**
   * Unique identifier for the channel (e.g., 'whatsapp', 'telegram').
   */
  readonly id: string;

  /**
   * Initializes the channel adapter.
   */
  initialize(): Promise<void>;

  /**
   * Shuts down the channel adapter and cleans up resources.
   */
  shutdown(): Promise<void>;

  /**
   * Sends a message through this channel.
   * @param tenantId The ID of the tenant sending the message.
   * @param target The recipient identifier (e.g., phone number, username).
   * @param content The message content (text, media, etc.).
   */
  sendMessage(tenantId: string, target: string, content: any): Promise<void>;

  /**
   * Registers a handler for inbound messages.
   */
  onMessage(handler: (event: InboundMessageEvent) => Promise<void>): void;
}

/**
 * Represents an inbound message from any channel.
 */
export interface InboundMessageEvent {
  tenantId: string;
  channelId: string;
  sender: string;
  content: any;
  timestamp: Date;
  raw: any; // Original channel-specific message object
}

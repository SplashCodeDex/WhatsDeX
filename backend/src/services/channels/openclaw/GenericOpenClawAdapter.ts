import { type ChannelAdapter, type InboundMessageEvent, type ChannelId } from "../ChannelAdapter.js";
import { CommonMessage } from "../../../types/omnichannel.js";
import logger from "@/utils/logger.js";
import * as crypto from 'crypto';

import { getWebOutbound } from '@/utils/openclawImports.js';

/**
 * Universal bridge adapter for OpenClaw-supported platforms lacking a custom DeXMart adapter.
 * Uses dynamic dispatch mapping (e.g. 'msteams' -> sendMessageMsteams).
 */
export class GenericOpenClawAdapter implements ChannelAdapter {
  public readonly id: ChannelId;
  public readonly instanceId: string;
  public readonly fullPath?: string;
  private messageHandler: ((event: InboundMessageEvent) => Promise<void>) | null = null;
  private credentials: Record<string, any>;

  constructor(
    private tenantId: string,
    private channelId: string,
    fullPath: string | undefined,
    private channelData: any
  ) {
    // Determine the platform type (e.g., 'msteams', 'matrix', 'twitch')
    this.id = channelData?.type || 'generic';
    this.instanceId = channelId;
    this.fullPath = fullPath;
    this.credentials = channelData?.credentials || {};
    
    if (Object.keys(this.credentials).length === 0) {
      logger.warn(`[GenericOpenClawAdapter] Initialized generic adapter for ${this.id} with no credentials.`);
    }
  }

  async initialize(): Promise<void> {
    logger.info(`[GenericOpenClawAdapter] Initializing universal bridge for platform: ${this.id} (Channel: ${this.channelId})`);
  }

  async connect(): Promise<void> {
    logger.info(`[GenericOpenClawAdapter] Connected ${this.id} bridge`);
  }

  async disconnect(): Promise<void> {
    logger.info(`[GenericOpenClawAdapter] Disconnected ${this.id} bridge`);
  }

  async shutdown(): Promise<void> {
    await this.disconnect();
  }

  async sendMessage(target: string, content: any): Promise<void> {
    const outbound = await getWebOutbound();
    if (!outbound) {
      throw new Error("OpenClaw outbound module not available.");
    }

    // Attempt to invoke the target platform's specific send function dynamically.
    // E.g., for channel_type 'msteams', look for 'sendMessageMsteams'
    const functionName = `sendMessage${this.id.charAt(0).toUpperCase() + this.id.slice(1).toLowerCase()}`;
    const text = typeof content === 'string' ? content : content.text || JSON.stringify(content);

    if (typeof outbound[functionName] === 'function') {
      logger.info(`[GenericOpenClawAdapter] Dispatching via ${functionName} to ${target}`);
      await outbound[functionName](target, text, this.credentials);
    } else {
      logger.warn(`[GenericOpenClawAdapter] ${functionName} not found in OpenClaw. Cannot send outbound message for ${this.id}.`);
      throw new Error(`Unsupported generic platform outbound dispatch: ${this.id}`);
    }
  }

  public async sendCommon(message: CommonMessage): Promise<void> {
    if (!message.content.text) return;
    await this.sendMessage(message.to, message.content.text);
  }

  public onMessage(handler: (event: InboundMessageEvent) => Promise<void>): void {
    this.messageHandler = handler;
  }

  /**
   * Captures incoming webhooks (e.g. MS Teams messages, Matrix events, Slack hooks)
   * routed to POST /api/webhook/:channelId and transforms them into standard
   * DeXMart InboundMessageEvent shapes for the internal intelligence engines.
   */
  public async handleWebhook(req: any, res: any): Promise<void> {
    if (!this.messageHandler) {
      logger.warn(`[GenericOpenClawAdapter] Received webhook for ${this.id} but no message handler is registered`);
      res.status(200).send('OK (No handler)');
      return;
    }

    try {
      const payload = req.body;
      if (!payload) {
        res.status(400).send('Bad Request: Missing JSON Body');
        return;
      }

      // Webhook Authentication: Zero Trust Enforcement
      // Validates X-Hub-Signature HMAC or standard Authorization Bearer matching the generated webhookSecret
      const providedSignature = req.headers['x-hub-signature'] || req.headers['authorization'];
      // Look in both channelData.config and channelData.credentials
      const genericConfig = (this as any).channelData?.config || {};
      const expectedSecret = genericConfig.webhookSecret || this.credentials.webhookSecret || this.credentials.token;

      if (expectedSecret) {
        if (!providedSignature) {
          logger.warn(`[GenericOpenClawAdapter] Missing authentication headers on webhook for ${this.id}`);
          res.status(401).send('Unauthorized: Missing Signature');
          return;
        }

        if (providedSignature.startsWith('Bearer ')) {
          const token = providedSignature.split(' ')[1];
          if (token !== expectedSecret) {
            logger.warn(`[GenericOpenClawAdapter] Invalid Bearer token on webhook for ${this.id}`);
            res.status(401).send('Unauthorized: Invalid Token');
            return;
          }
        } else {
          try {
            const payloadString = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
            const hmac = crypto.createHmac('sha256', expectedSecret).update(payloadString).digest('hex');
            const expectedSignature = `sha256=${hmac}`;

            if (providedSignature !== expectedSignature && providedSignature !== hmac) {
               logger.warn(`[GenericOpenClawAdapter] Invalid HMAC signature on webhook for ${this.id}`);
               res.status(401).send('Unauthorized: Invalid Signature');
               return;
            }
          } catch (e) {
            logger.error(`[GenericOpenClawAdapter] Signature validation error`, e);
            res.status(500).send('Internal Server Error');
            return;
          }
        }
      }

      // Universal heuristic matching to extract primary text and routing targets.
      // E.g., Bot Framework (Teams): payload.conversation.id (for replies), payload.from.id (user)
      // E.g., Slack Events API: payload.event.channel (for replies), payload.event.user (user)
      const text = payload.text || payload.content || payload.event?.text || payload.message?.text;
      
      // The 'sender' field acts as the routing target for DeXMart replies. 
      // We MUST prioritize Thread/Channel/Conversation IDs over User IDs to prevent bots from
      // breaking out of group chats and DMing people privately.
      const replyTarget = 
        payload.conversation?.id || 
        payload.space?.name || 
        payload.channel?.id || 
        payload.event?.channel || 
        payload.sender?.id || 
        payload.from?.id || 
        payload.event?.user || 
        payload.user || 
        payload.author;

      const messageId = payload.id || payload.message_id || payload.eventId || payload.event?.client_msg_id || req.headers['x-request-id'];

      // Only pass forward actionable messages with parsable text
      if (text) {
        const event: InboundMessageEvent = {
          tenantId: this.tenantId,
          channelId: this.instanceId,
          channelType: this.id as ChannelId,
          fullPath: this.fullPath,
          sender: replyTarget || "unknown_sender",
          content: text,
          timestamp: new Date(),
          raw: {
            ...payload,
            id: messageId
          }
        };
        await this.messageHandler(event);
      }
      
      // Acknowledge the webhook successfully
      res.status(200).send('OK');
    } catch (error) {
      logger.error(`[GenericOpenClawAdapter] Error processing inbound webhook for ${this.id}:`, error);
      res.status(500).send('Internal Server Error');
    }
  }
}

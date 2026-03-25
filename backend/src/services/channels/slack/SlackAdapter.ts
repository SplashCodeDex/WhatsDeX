import { getSlackSend } from '@/utils/openclawImports.js';
import { type ChannelAdapter, type InboundMessageEvent, type ChannelId } from "../ChannelAdapter.js";
import { CommonMessage } from "../../../types/omnichannel.js";
import logger from "@/utils/logger.js";
import * as crypto from 'crypto';

/**
 * Adapter for Slack integration.
 */
export class SlackAdapter implements ChannelAdapter {
  public readonly id: ChannelId = "slack";
  public readonly instanceId: string;
  private messageHandler: ((event: InboundMessageEvent) => Promise<void>) | null = null;

  private token: string;
  public fullPath?: string;

  constructor(
    private tenantId: string,
    private channelId: string,
    fullPath: string | undefined,
    private channelData: any
  ) {
    this.instanceId = channelId;
    this.fullPath = fullPath;
    this.token = channelData?.credentials?.token || '';
    if (!this.token) throw new Error('Missing Slack token in channelData');
  }

  async initialize(): Promise<void> {
    logger.info(`[SlackAdapter] Initializing for ${this.channelId}`);
  }

  async connect(): Promise<void> {
    // In OpenClaw, Slack is often handled via the gateway or direct calls.
    // For a persistent listener, we might need to hook into OpenClaw's monitor.
    logger.info(`[SlackAdapter] Connected for channel ${this.channelId}`);
  }

  async disconnect(): Promise<void> {
    logger.info(`[SlackAdapter] Disconnected`);
  }

  async shutdown(): Promise<void> {
    await this.disconnect();
  }

  async sendMessage(target: string, content: any): Promise<void> {
    const text = typeof content === 'string' ? content : content.text || JSON.stringify(content);
    const { sendMessageSlack } = await getSlackSend();
    await sendMessageSlack(target, text, {
      token: this.token
    });
  }

  public async sendCommon(message: CommonMessage): Promise<void> {
    if (!message.content.text) return;
    await this.sendMessage(message.to, message.content.text);
  }

  public onMessage(handler: (event: InboundMessageEvent) => Promise<void>): void {
    this.messageHandler = handler;
  }

  public async handleWebhook(req: any, res: any): Promise<void> {
    if (!this.messageHandler) {
      logger.warn(`[SlackAdapter] Received webhook for ${this.id} but no message handler is registered`);
      res.status(200).send('OK (No handler)');
      return;
    }

    try {
      const payload = req.body;
      if (!payload) return res.status(400).send('Bad Request');

      // Slack Signature Verification Enforcement
      const signingSecret = this.channelData?.credentials?.signingSecret;
      if (signingSecret) {
        const signature = req.headers['x-slack-signature'] as string;
        const timestamp = req.headers['x-slack-request-timestamp'] as string;
        if (!signature || !timestamp) {
           logger.warn(`[SlackAdapter] Missing Slack signature headers`);
           return res.status(401).send('Unauthorized: Missing headers');
        }
        
        // Prevent Replay Attacks
        const timeVal = parseInt(timestamp, 10);
        if (Math.abs(Date.now() / 1000 - timeVal) > 60 * 5) {
           logger.warn(`[SlackAdapter] Slack timestamp expired: potential replay attack`);
           return res.status(401).send('Unauthorized: Expired');
        }
        
        // Compute HMAC SHA256
        const payloadString = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        const sigBaseString = `v0:${timestamp}:${payloadString}`;
        const mySignature = 'v0=' + crypto.createHmac('sha256', signingSecret).update(sigBaseString).digest('hex');
        
        try {
          if (!crypto.timingSafeEqual(Buffer.from(mySignature), Buffer.from(signature))) {
             logger.warn(`[SlackAdapter] Invalid Slack signature`);
             return res.status(401).send('Unauthorized: Invalid Signature');
          }
        } catch (e) {
             logger.error(`[SlackAdapter] Signature validation buffer error`, e);
             return res.status(500).send('Internal Server Error');
        }
      }

      // Slack Events API Verification (URL Challenge)
      if (payload.type === 'url_verification') {
        return res.status(200).send({ challenge: payload.challenge });
      }

      const text = payload.event?.text || payload.text;
      
      // Ensure we reply to the channel/thread context, not directly to the user's private DM
      const replyTarget = payload.event?.channel || payload.channel_id || payload.event?.user || payload.user_id;
      
      const messageId = payload.event?.client_msg_id || payload.trigger_id || req.headers['x-request-id'];

      if (text && replyTarget && !payload.event?.bot_id) {
        const event: InboundMessageEvent = {
          tenantId: this.tenantId,
          channelId: this.instanceId,
          channelType: this.id as ChannelId,
          fullPath: this.fullPath,
          sender: replyTarget,
          content: text,
          timestamp: new Date(),
          raw: { ...payload, id: messageId }
        };
        await this.messageHandler(event);
      }
      res.status(200).send('OK');
    } catch (error) {
      logger.error(`[SlackAdapter] Error processing inbound webhook:`, error);
      res.status(500).send('Internal Server Error');
    }
  }
}

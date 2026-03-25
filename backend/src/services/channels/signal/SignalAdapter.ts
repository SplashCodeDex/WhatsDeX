import { getSignalSend } from '@/utils/openclawImports.js';
import { type ChannelAdapter, type InboundMessageEvent, type ChannelId } from "../ChannelAdapter.js";
import { CommonMessage } from "../../../types/omnichannel.js";
import logger from "@/utils/logger.js";
import * as crypto from 'crypto';

/**
 * Adapter for Signal integration.
 */
export class SignalAdapter implements ChannelAdapter {
  public readonly id: ChannelId = "signal";
  public readonly instanceId: string;
  private messageHandler: ((event: InboundMessageEvent) => Promise<void>) | null = null;

  private phoneNumber: string;
  private webhookSecret?: string;
  public fullPath?: string;

  constructor(
    private tenantId: string,
    private channelId: string,
    fullPath: string | undefined,
    channelData: any
  ) {
    this.instanceId = channelId;
    this.fullPath = fullPath;
    this.phoneNumber = channelData?.phoneNumber || channelData?.credentials?.phone || '';
    this.webhookSecret = channelData?.config?.webhookSecret || channelData?.credentials?.webhookSecret;
    if (!this.phoneNumber) throw new Error('Missing Signal phone number in channelData');
  }

  async initialize(): Promise<void> {
    logger.info(`[SignalAdapter] Initializing for ${this.phoneNumber}`);
  }

  async connect(): Promise<void> {
    logger.info(`[SignalAdapter] Connected for channel ${this.channelId}`);
  }

  async disconnect(): Promise<void> {
    logger.info(`[SignalAdapter] Disconnected`);
  }

  async shutdown(): Promise<void> {
    await this.disconnect();
  }

  async sendMessage(target: string, content: any): Promise<void> {
    const text = typeof content === 'string' ? content : content.text || JSON.stringify(content);
    const { sendMessageSignal } = await getSignalSend();
    await sendMessageSignal(target, text, {
      accountId: this.phoneNumber // In OpenClaw Signal accountId is often the phone
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
      logger.warn(`[SignalAdapter] Received webhook for ${this.id} but no context is ready`);
      res.status(200).send('OK');
      return;
    }

    try {
      const payload = req.body;
      if (!payload) return res.status(400).send('Bad Request');

      // Webhook Authentication
      if (this.webhookSecret) {
        const providedSignature = req.headers['x-hub-signature'] || req.headers['authorization'];
        if (!providedSignature) {
          logger.warn(`[SignalAdapter] Missing authentication headers on webhook`);
          return res.status(401).send('Unauthorized: Missing Signature');
        }

        if (providedSignature.startsWith('Bearer ')) {
          const token = providedSignature.split(' ')[1];
          if (token !== this.webhookSecret) {
            logger.warn(`[SignalAdapter] Invalid Bearer token on webhook`);
            return res.status(401).send('Unauthorized: Invalid Token');
          }
        } else {
          try {
            const payloadString = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
            const hmac = crypto.createHmac('sha256', this.webhookSecret).update(payloadString).digest('hex');
            const expectedSignature = `sha256=${hmac}`;

            if (providedSignature !== expectedSignature && providedSignature !== hmac) {
               logger.warn(`[SignalAdapter] Invalid HMAC signature on webhook`);
               return res.status(401).send('Unauthorized: Invalid Signature');
            }
          } catch (e) {
            logger.error(`[SignalAdapter] Signature validation error`, e);
            return res.status(500).send('Internal Server Error');
          }
        }
      }

      const text = payload.rawMessage?.body || payload.text || payload.content;
      const sender = payload.source || payload.sender || payload.from;
      const messageId = payload.timestamp || req.headers['x-request-id'] || crypto.randomUUID();

      if (text && sender) {
        const event: InboundMessageEvent = {
          tenantId: this.tenantId,
          channelId: this.instanceId,
          channelType: this.id as ChannelId,
          fullPath: this.fullPath,
          sender,
          content: text,
          timestamp: new Date(Number(payload.timestamp)),
          raw: { ...payload, id: messageId }
        };
        await this.messageHandler(event);
      }
      res.status(200).send('OK');
    } catch (error) {
      logger.error(`[SignalAdapter] Error processing inbound webhook:`, error);
      res.status(500).send('Error');
    }
  }
}

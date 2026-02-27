import { proto } from 'baileys';
import logger from '@/utils/logger.js';
import { webhookService } from './webhookService.js';
import { channelService } from './ChannelService.js';
import { agentService } from './AgentService.js';
import { createBotContext } from '../utils/createBotContext.js';
import { GlobalContext } from '../types/index.js';
import { tenantConfigService } from './tenantConfigService.js';
import analyticsService from './analytics.js';
import { Agent } from '../types/contracts.js';

/**
 * Ingress Service
 * 
 * Centralized entry point for all incoming messages from all channels.
 * Handles the "Agent exists ? Agent Respond : Webhook Forward" logic.
 */
export class IngressService {
  private static instance: IngressService;

  private constructor() {}

  public static getInstance(): IngressService {
    if (!IngressService.instance) {
      IngressService.instance = new IngressService();
    }
    return IngressService.instance;
  }

  /**
   * Process an incoming message from any channel.
   * @param fullPath Optional full Firestore path for path-aware routing (tenants/T/agents/A/channels/C)
   */
  async handleMessage(tenantId: string, channelId: string, message: proto.IWebMessageInfo, context: GlobalContext, fullPath?: string): Promise<void> {
    try {
      logger.info(`Processing message for channel ${channelId} (Tenant: ${tenantId}, Path: ${fullPath || 'flat'})`);

      let activeAgent: Agent | null = null;

      // 1. Resolve Agent from Path
      if (fullPath && fullPath.includes('/agents/')) {
        // Path: tenants/{tenantId}/agents/{agentId}/channels/{channelId}
        const parts = fullPath.split('/');
        const agentId = parts[3]; 
        
        const agentResult = await agentService.getAgent(tenantId, agentId);
        activeAgent = agentResult.success ? agentResult.data : null;
      }

      // 2. Prepare AI Context
      const aiCtx = await createBotContext({ tenantId, botId: channelId } as any, message, context);

      if (activeAgent && activeAgent.id !== 'system_default') {
        // --- AGENT MODE ---
        logger.info(`Routing to Agent: ${activeAgent.name} (${activeAgent.id})`);
        
        // Enforce Feature Flag: Check if AI is enabled for this tenant
        const isAiEnabled = await tenantConfigService.isFeatureEnabled(tenantId, 'aiEnabled');
        if (isAiEnabled && context.unifiedAI) {
          await context.unifiedAI.processMessage({ tenantId, botId: channelId } as any, aiCtx);
        } else {
          logger.warn(`AI processing skipped for tenant ${tenantId}: AI disabled or service missing.`);
          await this.dispatchWebhook(tenantId, channelId, message, aiCtx);
        }
      } else {
        // --- WEBHOOK ONLY MODE (Includes system_default) ---
        logger.info(`No AI Agent assigned (or system_default). Forwarding to Webhook.`);
        await this.dispatchWebhook(tenantId, channelId, message, aiCtx);
      }

      // 3. Post-processing
      analyticsService.trackMessage(tenantId, 'received');

    } catch (error: unknown) {
      logger.error(`IngressService error for channel ${channelId}:`, error);
    }
  }

  private async dispatchWebhook(tenantId: string, channelId: string, message: proto.IWebMessageInfo, aiCtx: any) {
    const text = aiCtx.message?.conversation || aiCtx.message?.extendedTextMessage?.text || '';
    
    await webhookService.dispatch(tenantId, 'message.received', {
      channelId,
      botId: channelId, // Backward compat
      sender: aiCtx.sender.jid,
      message: text,
      timestamp: Date.now(),
      raw: message
    });
  }
}

export const ingressService = IngressService.getInstance();
export default ingressService;

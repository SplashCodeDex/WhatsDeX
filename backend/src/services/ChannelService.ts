import { firebaseService } from '@/services/FirebaseService.js';
import { multiTenantService } from '@/services/multiTenantService.js';
import { Channel, ChannelSchema, Result } from '../types/contracts.js';
import { Timestamp } from 'firebase-admin/firestore';
import logger from '@/utils/logger.js';
import crypto from 'crypto';
import { channelManager } from './channels/ChannelManager.js';

/**
 * Channel Service
 * 
 * Manages the lifecycle of connectivity slots (formerly 'Bots').
 * Operates within the Agent hierarchy: tenants/T/agents/A/channels/C.
 */
export class ChannelService {
  private static instance: ChannelService;

  private constructor() {}

  public static getInstance(): ChannelService {
    if (!ChannelService.instance) {
      ChannelService.instance = new ChannelService();
    }
    return ChannelService.instance;
  }

  /**
   * Helper to build the nested collection path
   */
  private getPath(agentId: string = 'system_default'): string {
    return `agents/${agentId}/channels`;
  }

  /**
   * Create a new channel slot
   */
  async createChannel(tenantId: string, channelData: Partial<Channel>, agentId: string = 'system_default'): Promise<Result<Channel>> {
    try {
      const canAddResult = await multiTenantService.canAddBot(tenantId);
      if (!canAddResult.success) {
        throw canAddResult.error;
      }
      if (!canAddResult.data) {
        throw new Error('Channel limit exceeded for your current plan.');
      }

      const channelId = `chan_${crypto.randomUUID()}`;
      const { createdAt, updatedAt, ...restData } = channelData;

      const rawData = {
        id: channelId,
        name: restData.name || 'New Channel',
        status: 'disconnected' as const,
        type: restData.type || 'whatsapp',
        assignedAgentId: agentId,
        stats: {
          messagesSent: 0,
          messagesReceived: 0,
          contactsCount: 0,
          errorsCount: 0
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        ...restData
      };

      const data = ChannelSchema.parse(rawData);
      await firebaseService.setDoc(this.getPath(agentId), channelId, data as any, tenantId);

      logger.info(`Channel created: ${channelId} for tenant ${tenantId} under Agent ${agentId}`);
      return { success: true, data };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`ChannelService.createChannel error [${tenantId}]:`, err);
      return { success: false, error: err };
    }
  }

  /**
   * Get a single channel by ID
   */
  async getChannel(tenantId: string, channelId: string, agentId: string = 'system_default'): Promise<Result<Channel>> {
    try {
      const doc = await firebaseService.getDoc(this.getPath(agentId), channelId, tenantId);
      if (!doc) {
        return { success: false, error: new Error(`Channel not found: ${channelId}`) };
      }
      return { success: true, data: doc as Channel };
    } catch (error: any) {
      return { success: false, error };
    }
  }

  /**
   * List all channels for an agent
   */
  async getChannelsForAgent(tenantId: string, agentId: string): Promise<Result<Channel[]>> {
    try {
      const docs = await firebaseService.getCollection(this.getPath(agentId), tenantId);
      return { success: true, data: docs as Channel[] };
    } catch (error: any) {
      return { success: false, error };
    }
  }

  /**
   * List all channels across all agents for a tenant.
   * Useful for the Omnichannel Hub (Global View).
   */
  async getAllChannelsAcrossAgents(tenantId: string): Promise<Result<Channel[]>> {
    try {
      const { agentService } = await import('./AgentService.js');
      const agentsResult = await agentService.getAllAgents(tenantId);
      
      if (!agentsResult.success) return { success: false, error: agentsResult.error };

      const allChannels: Channel[] = [];
      
      // Ensure system_default is always checked first or included in the list
      await agentService.ensureSystemAgent(tenantId);
      
      for (const agent of agentsResult.data) {
        const chanResult = await this.getChannelsForAgent(tenantId, agent.id);
        if (chanResult.success) {
          allChannels.push(...chanResult.data);
        }
      }

      return { success: true, data: allChannels };
    } catch (error: any) {
      return { success: false, error };
    }
  }

  /**
   * Update channel metadata
   */
  async updateChannel(tenantId: string, channelId: string, patch: Partial<Channel>, agentId: string = 'system_default'): Promise<Result<Channel>> {
    try {
      const updateData = {
        ...patch,
        updatedAt: Timestamp.now()
      };
      await firebaseService.setDoc(this.getPath(agentId), channelId, updateData as any, tenantId, true);
      
      return await this.getChannel(tenantId, channelId, agentId);
    } catch (error: any) {
      return { success: false, error };
    }
  }

  /**
   * Start a channel instance (OpenClaw)
   */
  async startChannel(tenantId: string, channelId: string, agentId: string = 'system_default'): Promise<Result<void>> {
    try {
      const channelResult = await this.getChannel(tenantId, channelId, agentId);
      if (!channelResult.success) return { success: false, error: channelResult.error };
      
      const channel = channelResult.data;
      const fullPath = `tenants/${tenantId}/agents/${agentId}/channels/${channelId}`;

      // Initialize Adapter
      if (channel.type === 'whatsapp') {
        const adapter = new WhatsappAdapter(tenantId, channelId, fullPath);
        
        adapter.onMessage(async (event) => {
          const { ingressService } = await import('./IngressService.js');
          const context = await (await import('../lib/context.js')).default();
          await ingressService.handleMessage(tenantId, channelId, event.raw, context, fullPath);
        });

        await adapter.connect();
        channelManager.registerAdapter(adapter);
      } else {
        return { success: false, error: new Error(`Unsupported channel type: ${channel.type}`) };
      }

      await this.updateStatus(tenantId, channelId, 'connected', agentId);
      return { success: true, data: undefined };
    } catch (error: any) {
      logger.error(`Failed to start channel ${channelId}:`, error);
      await this.updateStatus(tenantId, channelId, 'error', agentId);
      return { success: false, error };
    }
  }

  /**
   * Stop a channel instance
   */
  async stopChannel(channelId: string, tenantId: string, agentId: string = 'system_default'): Promise<Result<void>> {
    try {
      await channelManager.shutdownAdapter(channelId);
      await this.updateStatus(tenantId, channelId, 'disconnected', agentId);
      return { success: true, data: undefined };
    } catch (error: any) {
      return { success: false, error };
    }
  }

  /**
   * Delete a channel slot
   * STRICT: Shuts down live connection BEFORE deleting database record.
   */
  async deleteChannel(tenantId: string, channelId: string, agentId: string = 'system_default'): Promise<Result<void>> {
    try {
      // 1. Kill live session in memory (Rule 0 / Rule 9 integrity)
      await channelManager.shutdownAdapter(channelId);

      // 2. Remove from Firestore
      await firebaseService.deleteDoc(this.getPath(agentId), channelId, tenantId);
      
      logger.info(`Channel deleted: ${channelId} from tenant ${tenantId} under Agent ${agentId}`);
      return { success: true, data: undefined };
    } catch (error: any) {
      logger.error(`Failed to delete channel ${channelId}:`, error);
      return { success: false, error };
    }
  }

  /**
   * Update channel connectivity status
   */
  async updateStatus(tenantId: string, channelId: string, status: Channel['status'], agentId: string = 'system_default'): Promise<void> {
    await this.updateChannel(tenantId, channelId, { status }, agentId).catch(err => 
      logger.error(`Failed to update status for channel ${channelId}:`, err)
    );
  }
}

export const channelService = ChannelService.getInstance();
export default channelService;

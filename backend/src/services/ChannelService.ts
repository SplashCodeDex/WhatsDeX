import { firebaseService } from '@/services/FirebaseService.js';
import { multiTenantService } from '@/services/multiTenantService.js';
import { Channel, ChannelSchema, Result } from '../types/contracts.js';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import logger from '@/utils/logger.js';
import crypto from 'crypto';
import { channelManager } from './channels/ChannelManager.js';
import { WhatsappAdapter } from './channels/whatsapp/WhatsappAdapter.js';

/**
 * Channel Service
 *
 * Manages the lifecycle of connectivity slots (formerly 'Bots').
 * Operates within the Agent hierarchy: tenants/T/agents/A/channels/C.
 */
export class ChannelService {
  private static instance: ChannelService;

  private constructor() { }

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
          // MASTERMIND Goodie: Memory-State Truth Sync
          const synchronized = chanResult.data.map(chan => this.syncMemoryStatus(chan));
          allChannels.push(...synchronized);
        }
      }

      return { success: true, data: allChannels };
    } catch (error: any) {
      return { success: false, error };
    }
  }

  /**
   * Synchronize Firestore status with real memory state
   */
  private syncMemoryStatus(channel: Channel): Channel {
    const isInMemory = !!channelManager.getAdapter(channel.id);
    let status = channel.status;

    if (isInMemory && (status === 'disconnected' || status === 'error')) {
      status = 'connected'; // Sync UP
    } else if (!isInMemory && status === 'connected') {
      status = 'disconnected'; // Sync DOWN (stale from crash)
    }

    return {
      ...channel,
      status,
      phoneNumber: channel.phoneNumber || undefined
    };
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
      if (channelManager.getAdapter(channelId)) {
        logger.info(`Channel ${channelId} is already running`);
        return { success: true, data: undefined };
      }

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

          // Increment received stats
          this.incrementChannelStat(tenantId, channelId, 'messagesReceived', agentId);

          await ingressService.handleMessage(tenantId, channelId, event.raw, context, fullPath);
        });

        await adapter.connect();
        channelManager.registerAdapter(adapter);
      } else if (channel.type === 'telegram') {
        const { TelegramAdapter } = await import('./channels/telegram/TelegramAdapter.js');
        const token = channel.credentials?.token;
        if (!token) throw new Error('Missing Telegram token');

        const adapter = new TelegramAdapter(tenantId, channelId, token);
        adapter.onMessage(async (event) => {
          const { ingressService } = await import('./IngressService.js');
          const context = await (await import('../lib/context.js')).default();

          // Increment received stats
          this.incrementChannelStat(tenantId, channelId, 'messagesReceived', agentId);

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
   * Resume all active channels across all tenants.
   * STRICT: Used on server boot to restore connectivity.
   */
  async resumeActiveChannels(): Promise<void> {
    logger.info('>>> [MASTERMIND] Resuming all active channels...');
    try {
      const { multiTenantService } = await import('./multiTenantService.js');
      const tenants = await multiTenantService.listTenants();

      let totalStarted = 0;

      for (const tenant of tenants) {
        if (tenant.status !== 'active') continue;

        // Get all channels across all agents for this tenant
        const channelsResult = await this.getAllChannelsAcrossAgents(tenant.id);
        if (!channelsResult.success) continue;

        for (const channel of channelsResult.data) {
          // Restart channels that were previously connected or in error state (retry)
          if (channel.status === 'connected' || channel.status === 'connecting' || channel.status === 'qr_pending') {
            logger.info(`[ChannelService] Auto-starting channel ${channel.id} (${channel.name}) for tenant ${tenant.id}`);

            // Non-blocking start
            this.startChannel(tenant.id, channel.id, channel.assignedAgentId || undefined).catch(err => {
              logger.error(`[ChannelService] Failed to auto-start channel ${channel.id}:`, err);
            });
            totalStarted++;
          }
        }
      }

      logger.info(`[ChannelService] Successfully queued ${totalStarted} channels for resumption.`);
    } catch (error) {
      logger.error('[ChannelService] Critical error during channel resumption:', error);
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

  /**
   * Increment channel statistics in Firestore
   */
  async incrementChannelStat(tenantId: string, channelId: string, field: 'messagesSent' | 'messagesReceived' | 'errorsCount', agentId: string = 'system_default'): Promise<void> {
    try {
      const updateData: any = {
        updatedAt: Timestamp.now()
      };
      updateData[`stats.${field}`] = FieldValue.increment(1);

      await firebaseService.setDoc(
        this.getPath(agentId),
        channelId,
        updateData,
        tenantId,
        true
      );
    } catch (err) {
      logger.error(`[ChannelService] Failed to increment stat ${field} for channel ${channelId}:`, err);
    }
  }

  /**
   * Get the current QR code for a channel (image DataURL)
   */
  public getChannelQR(channelId: string): string | null {
    const adapter = channelManager.getAdapter(channelId);
    if (adapter && (adapter as any).getQR) {
      return (adapter as any).getQR();
    }
    return null;
  }

  /**
   * Request a pairing code for a channel
   */
  public async requestPairingCode(tenantId: string, channelId: string, phoneNumber: string, agentId: string = 'system_default'): Promise<Result<string>> {
    try {
      let adapter = channelManager.getAdapter(channelId);
      if (!adapter) {
        // Start if not running
        await this.startChannel(tenantId, channelId, agentId);
        adapter = channelManager.getAdapter(channelId);
      }

      if (adapter && (adapter as any).requestPairingCode) {
        const code = await (adapter as any).requestPairingCode(phoneNumber);
        return { success: true, data: code };
      }
      return { success: false, error: new Error('Pairing code not supported for this channel') };
    } catch (error: any) {
      return { success: false, error };
    }
  }

  /**
   * Get global stats for dashboard
   */
  public getGlobalStats() {
    const keys = channelManager.getRegisteredChannelKeys();
    return {
      activeChannels: keys.length,
      totalAdapters: keys.length,
      runningProcesses: 1
    };
  }

  /**
   * Get simple list of active channel IDs
   */
  public getActiveChannelIds() {
    return channelManager.getRegisteredChannelKeys().map(id => ({ id, isActive: true }));
  }
}

export const channelService = ChannelService.getInstance();
export default channelService;

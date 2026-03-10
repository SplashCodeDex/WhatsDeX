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
 * Manages the lifecycle of connectivity slots.
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
      const { multiTenantService } = await import('@/services/multiTenantService.js');
      const canAddResult = await multiTenantService.canAddChannel(tenantId);
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

    // Do not force 'connected' for WhatsApp channels as they emit accurate fine-grained statuses (qr_pending, disconnected, error)
    if (isInMemory && channel.type !== 'whatsapp' && (status === 'disconnected' || status === 'error')) {
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
   * Move a channel from one agent to another
   */
  async moveChannel(tenantId: string, channelId: string, currentAgentId: string, targetAgentId: string): Promise<Result<void>> {
    try {
      if (currentAgentId === targetAgentId) return { success: true, data: undefined };

      // 1. Get existing channel data
      const channelResult = await this.getChannel(tenantId, channelId, currentAgentId);
      if (!channelResult.success) return { success: false, error: channelResult.error };

      const channel = channelResult.data;

      // 2. Create new document at target path
      const updatedChannel = {
        ...channel,
        assignedAgentId: targetAgentId,
        updatedAt: Timestamp.now()
      };
      await firebaseService.setDoc(this.getPath(targetAgentId), channelId, updatedChannel as any, tenantId);

      // 3. Delete old document
      await firebaseService.deleteDoc(this.getPath(currentAgentId), channelId, tenantId);

      // 4. Update memory adapter if running
      const adapter = channelManager.getAdapter(channelId);
      if (adapter && adapter.updatePath) {
        const newPath = `tenants/${tenantId}/agents/${targetAgentId}/channels/${channelId}`;
        adapter.updatePath(newPath);
        logger.info(`Channel ${channelId} adapter path updated to ${newPath}`);
      }

      logger.info(`Channel ${channelId} moved from ${currentAgentId} to ${targetAgentId}`);
      return { success: true, data: undefined };
    } catch (error: any) {
      logger.error(`Failed to move channel ${channelId}:`, error);
      return { success: false, error };
    }
  }

  /**
   * Start a channel instance (OpenClaw)
   */
  async startChannel(tenantId: string, channelId: string, agentId: string = 'system_default', force: boolean = false): Promise<Result<void>> {
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
        const adapter = new WhatsappAdapter(tenantId, channelId, fullPath, channel as any);

        // --- MIDDLEWARE INJECTION ---
        // Register the main middleware stack
        const { default: mainMiddleware } = await import('../middleware/main.js');
        const gCtx = await (await import('../lib/context.js')).default();
        mainMiddleware(adapter as any, gCtx);
        adapter.setContext(gCtx); // Set context for bridge usage

        adapter.onMessage(async (event) => {
          const { ingressService } = await import('./IngressService.js');
          const context = await (await import('../lib/context.js')).default();

          // Increment received stats
          this.incrementChannelStat(tenantId, channelId, 'messagesReceived', agentId);

          await ingressService.handleMessage(tenantId, channelId, event.raw, context, fullPath);
        });

        channelManager.registerAdapter(adapter);
        await adapter.connect(force);
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

          await ingressService.handleCommonMessage(tenantId, channelId, {
            id: event.raw.message_id?.toString() || crypto.randomUUID(),
            platform: 'telegram',
            from: event.sender,
            to: channelId,
            content: { text: event.content },
            timestamp: event.timestamp.getTime(),
            metadata: { raw: event.raw, fullPath }
          }, context, fullPath);
        });

        await adapter.connect();
        channelManager.registerAdapter(adapter);
      } else if (channel.type === 'discord') {
        const { DiscordAdapter } = await import('./channels/discord/DiscordAdapter.js');
        const token = channel.credentials?.token;
        const appId = channel.credentials?.appId;
        if (!token || !appId) throw new Error('Missing Discord token or appId');

        const adapter = new DiscordAdapter(tenantId, channelId, token); // DiscordAdapter constructor seems to take token as 3rd param in some versions, checking...
        // Wait, I saw the constructor in DiscordAdapter.ts: constructor(tenantId: string, channelId: string, token: string)
        const dAdapter = new DiscordAdapter(tenantId, channelId, token);

        dAdapter.onMessage(async (event) => {
          const { ingressService } = await import('./IngressService.js');
          const context = await (await import('../lib/context.js')).default();
          this.incrementChannelStat(tenantId, channelId, 'messagesReceived', agentId);

          await ingressService.handleCommonMessage(tenantId, channelId, {
            id: event.raw.id || crypto.randomUUID(),
            platform: 'discord',
            from: event.sender,
            to: channelId,
            content: { text: event.content },
            timestamp: event.timestamp.getTime(),
            metadata: { raw: event.raw, fullPath }
          }, context, fullPath);
        });

        await dAdapter.connect();
        channelManager.registerAdapter(dAdapter);
      } else if (channel.type === 'slack') {
        const { SlackAdapter } = await import('./channels/slack/SlackAdapter.js');
        const token = channel.credentials?.token;
        if (!token) throw new Error('Missing Slack token');

        const adapter = new SlackAdapter(tenantId, channelId, token);
        await adapter.connect();
        channelManager.registerAdapter(adapter);
      } else if (channel.type === 'signal') {
        const { SignalAdapter } = await import('./channels/signal/SignalAdapter.js');
        const phone = channel.phoneNumber || channel.credentials?.phone;
        if (!phone) throw new Error('Missing Signal phone number');

        const adapter = new SignalAdapter(tenantId, channelId, phone);
        await adapter.connect();
        channelManager.registerAdapter(adapter);
      } else if (channel.type === 'imessage') {
        const { IMessageAdapter } = await import('./channels/imessage/IMessageAdapter.js');
        const identifier = channel.identifier || channel.credentials?.identifier;
        if (!identifier) throw new Error('Missing iMessage identifier');

        const adapter = new IMessageAdapter(tenantId, channelId, identifier);
        await adapter.connect();
        channelManager.registerAdapter(adapter);
      } else if (channel.type === 'irc') {
        const { IRCAdapter } = await import('./channels/irc/IRCAdapter.ts' as any);
        const adapter = new IRCAdapter(tenantId, channelId, channel.credentials || {});
        await adapter.connect();
        channelManager.registerAdapter(adapter);
      } else if (channel.type === 'googlechat') {
        const { GoogleChatAdapter } = await import('./channels/googlechat/GoogleChatAdapter.ts' as any);
        const adapter = new GoogleChatAdapter(tenantId, channelId, channel.credentials || {});
        await adapter.connect();
        channelManager.registerAdapter(adapter);
      } else {
        return { success: false, error: new Error(`Unsupported channel type: ${channel.type}`) };
      }

      // Only mark as connected if it's not managed by the adapter itself (like WhatsApp)
      if (channel.type !== 'whatsapp') {
        await this.updateStatus(tenantId, channelId, 'connected', agentId);
      }

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
   * STRICT: Shuts down live connection BEFORE deleting/archiving database record.
   */
  async deleteChannel(tenantId: string, channelId: string, agentId: string = 'system_default', options: { archive?: boolean } = {}): Promise<Result<void>> {
    try {
      // 1. Kill live session in memory (Rule 0 / Rule 9 integrity)
      await channelManager.shutdownAdapter(channelId);

      if (options.archive) {
        // 2a. Mark as archived
        await this.updateStatus(tenantId, channelId, 'archived', agentId);
        logger.info(`Channel archived: ${channelId} for tenant ${tenantId}`);
      } else {
        // 2b. Remove from Firestore
        await firebaseService.deleteDoc(this.getPath(agentId), channelId, tenantId);
        
        // 2c. MASTERMIND Goodie: Cleanup Baileys Auth Credentials (Strict Integrity)
        // Path matches useFirestoreAuthState pattern
        const authPath = `agents/${agentId}/channels/${channelId}/auth`;
        await firebaseService.deleteCollection(authPath, tenantId);
        
        logger.info(`Channel deleted: ${channelId} from tenant ${tenantId} under Agent ${agentId} (with auth cleanup)`);
      }

      return { success: true, data: undefined };
    } catch (error: any) {
      logger.error(`Failed to delete/archive channel ${channelId}:`, error);
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
    const result = await this.updateChannel(tenantId, channelId, { status }, agentId);
    if (!result.success) throw result.error;

    // MASTERMIND Wiring: Real-time UI push
    const { socketService } = await import('./socketService.js');
    socketService.emitChannelStatus(tenantId, channelId, status);
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

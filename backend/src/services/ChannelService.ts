import { firebaseService } from '@/services/FirebaseService.js';
import { multiTenantService } from '@/services/multiTenantService.js';
import { Channel, ChannelSchema, Result } from '../types/contracts.js';
import { Timestamp } from 'firebase-admin/firestore';
import logger from '@/utils/logger.js';
import crypto from 'crypto';

/**
 * Channel Service
 * 
 * Manages the lifecycle of connectivity slots (formerly 'Bots').
 * Handles Firestore CRUD and basic status management.
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
   * Create a new channel slot
   */
  async createChannel(tenantId: string, channelData: Partial<Channel>): Promise<Result<Channel>> {
    try {
      // Logic from legacy MultiTenantBotService: check limits
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
      await firebaseService.setDoc<'tenants/{tenantId}/channels'>('channels', channelId, data as any, tenantId);

      logger.info(`Channel created: ${channelId} for tenant ${tenantId}`);
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
  async getChannel(tenantId: string, channelId: string): Promise<Result<Channel>> {
    try {
      const doc = await firebaseService.getDoc<'tenants/{tenantId}/channels'>('channels', channelId, tenantId);
      if (!doc) {
        return { success: false, error: new Error(`Channel not found: ${channelId}`) };
      }
      return { success: true, data: doc as Channel };
    } catch (error: any) {
      return { success: false, error };
    }
  }

  /**
   * List all channels for a tenant
   */
  async getAllChannels(tenantId: string): Promise<Result<Channel[]>> {
    try {
      const docs = await firebaseService.getCollection<'tenants/{tenantId}/channels'>('channels', tenantId);
      return { success: true, data: docs as Channel[] };
    } catch (error: any) {
      return { success: false, error };
    }
  }

  /**
   * Update channel metadata or configuration
   */
  async updateChannel(tenantId: string, channelId: string, patch: Partial<Channel>): Promise<Result<Channel>> {
    try {
      const updateData = {
        ...patch,
        updatedAt: Timestamp.now()
      };
      await firebaseService.setDoc<'tenants/{tenantId}/channels'>('channels', channelId, updateData as any, tenantId, true);
      
      const refreshed = await this.getChannel(tenantId, channelId);
      return refreshed;
    } catch (error: any) {
      return { success: false, error };
    }
  }

  /**
   * Delete a channel slot
   */
  async deleteChannel(tenantId: string, channelId: string): Promise<Result<void>> {
    try {
      // Note: Actual connection shutdown should be handled by ChannelManager
      await firebaseService.deleteDoc<'tenants/{tenantId}/channels'>('channels', channelId, tenantId);
      logger.info(`Channel deleted: ${channelId} from tenant ${tenantId}`);
      return { success: true, data: undefined };
    } catch (error: any) {
      return { success: false, error };
    }
  }

  /**
   * Update channel connectivity status
   */
  async updateStatus(tenantId: string, channelId: string, status: Channel['status']): Promise<void> {
    await this.updateChannel(tenantId, channelId, { status }).catch(err => 
      logger.error(`Failed to update status for channel ${channelId}:`, err)
    );
  }
}

export const channelService = ChannelService.getInstance();
export default channelService;

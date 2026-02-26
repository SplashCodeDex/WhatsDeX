import { firebaseService } from '@/services/FirebaseService.js';
import { Result, Agent, Channel } from '../types/contracts.js';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import logger from '@/utils/logger.js';
import channelService from './ChannelService.js';

/**
 * Channel Binding Service
 * 
 * Manages the bidirectional linkage between Channels (Phones) and Agents (Brains).
 * Ensures consistency between 'channels' collection and 'agents' collection.
 */
export class ChannelBindingService {
  private static instance: ChannelBindingService;

  private constructor() {}

  public static getInstance(): ChannelBindingService {
    if (!ChannelBindingService.instance) {
      ChannelBindingService.instance = new ChannelBindingService();
    }
    return ChannelBindingService.instance;
  }

  /**
   * Bind an Agent to a Channel
   */
  async bindAgentToChannel(tenantId: string, agentId: string, channelId: string): Promise<Result<void>> {
    try {
      logger.info(`Binding Agent ${agentId} to Channel ${channelId} for tenant ${tenantId}`);

      // 1. Verify Agent exists
      const agentDoc = await firebaseService.getDoc<'tenants/{tenantId}/agents'>('agents', agentId, tenantId);
      if (!agentDoc) {
        throw new Error(`Agent not found: ${agentId}`);
      }

      // 2. Verify Channel exists
      const channelResult = await channelService.getChannel(tenantId, channelId);
      if (!channelResult.success) {
        throw channelResult.error;
      }

      // 3. Update Channel (assignedAgentId)
      await firebaseService.setDoc<'tenants/{tenantId}/channels'>(
        'channels',
        channelId,
        { assignedAgentId: agentId, updatedAt: Timestamp.now() } as any,
        tenantId,
        true
      );

      // 4. Update Agent (boundChannels array) - Use arrayUnion for atomicity
      await firebaseService.setDoc<'tenants/{tenantId}/agents'>(
        'agents',
        agentId,
        { 
          boundChannels: FieldValue.arrayUnion(channelId),
          updatedAt: Timestamp.now()
        } as any,
        tenantId,
        true
      );

      return { success: true, data: undefined };
    } catch (error: any) {
      logger.error(`Failed to bind Agent ${agentId} to Channel ${channelId}:`, error);
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  /**
   * Unbind an Agent from a Channel
   */
  async unbindChannel(tenantId: string, channelId: string): Promise<Result<void>> {
    try {
      // 1. Get current binding
      const channelResult = await channelService.getChannel(tenantId, channelId);
      if (!channelResult.success) return channelResult;
      
      const agentId = channelResult.data.assignedAgentId;

      // 2. Clear Channel binding
      await firebaseService.setDoc<'tenants/{tenantId}/channels'>(
        'channels',
        channelId,
        { assignedAgentId: null, updatedAt: Timestamp.now() } as any,
        tenantId,
        true
      );

      // 3. If it was bound to an agent, remove from agent's list
      if (agentId) {
        await firebaseService.setDoc<'tenants/{tenantId}/agents'>(
          'agents',
          agentId,
          { 
            boundChannels: FieldValue.arrayRemove(channelId),
            updatedAt: Timestamp.now()
          } as any,
          tenantId,
          true
        );
      }

      return { success: true, data: undefined };
    } catch (error: any) {
      return { success: false, error };
    }
  }

  /**
   * Resolve the active Agent for a given Channel
   */
  async getActiveAgentForChannel(tenantId: string, channelId: string): Promise<Result<Agent | null>> {
    try {
      const channelResult = await channelService.getChannel(tenantId, channelId);
      if (!channelResult.success) return { success: false, error: channelResult.error };

      const agentId = channelResult.data.assignedAgentId;
      if (!agentId) return { success: true, data: null };

      const agentDoc = await firebaseService.getDoc<'tenants/{tenantId}/agents'>('agents', agentId, tenantId);
      return { success: true, data: agentDoc as Agent || null };
    } catch (error: any) {
      return { success: false, error };
    }
  }
}

export const channelBindingService = ChannelBindingService.getInstance();
export default channelBindingService;

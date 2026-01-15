/**
 * Group Service (2026 Mastermind Edition)
 *
 * Stateless service to handle all WhatsApp group operations.
 * Wraps Baileys socket methods and integrates with Tenant Database.
 */

import { GroupMetadata, ParticipantAction } from '@whiskeysockets/baileys';
import { Bot, GroupFunctions } from '../types/index.js';
import logger from '../utils/logger.js';

export class GroupService {

    /**
     * Create a scoped GroupFunctions object for a specific message context
     */
    createFunctions(bot: Bot, _tenantId: string, groupJid: string, senderJid: string): GroupFunctions {
        return {
            isAdmin: async (targetJid = senderJid) => this.isAdmin(bot, groupJid, targetJid),
            matchAdmin: async (targetId: string) => this.matchAdmin(bot, groupJid, targetId),
            members: async () => this.getMembers(bot, groupJid),
            isBotAdmin: async () => this.isBotAdmin(bot, groupJid),
            metadata: async () => this.getMetadata(bot, groupJid),
            owner: async () => this.getOwner(bot, groupJid),
            name: async () => this.getName(bot, groupJid),
            open: async () => this.updateSetting(bot, groupJid, 'announcement', false),
            close: async () => this.updateSetting(bot, groupJid, 'announcement', true),
            lock: async () => this.updateSetting(bot, groupJid, 'locked', true),
            unlock: async () => this.updateSetting(bot, groupJid, 'locked', false),
            add: async (jids) => this.addParticipants(bot, groupJid, jids),
            kick: async (jids) => this.removeParticipants(bot, groupJid, jids),
            promote: async (jids) => this.promoteParticipants(bot, groupJid, jids),
            demote: async (jids) => this.demoteParticipants(bot, groupJid, jids),
            inviteCode: async () => this.getInviteCode(bot, groupJid),
            pendingMembers: async () => [], // TODO
            approvePendingMembers: async (_jids) => ({}), // TODO
            rejectPendingMembers: async (_jids) => ({}), // TODO
            updateDescription: async (desc) => this.updateDescription(bot, groupJid, desc),
            updateSubject: async (subject) => this.updateSubject(bot, groupJid, subject),
            joinApproval: async (_mode) => ({}), // TODO
            membersCanAddMemberMode: async (mode) => this.updateMemberAddMode(bot, groupJid, mode),
            isOwner: async (targetJid = senderJid) => {
                const owner = await this.getOwner(bot, groupJid);
                // Check if targetJid matches owner or if superadmin logic applies
                return owner ? owner.includes(bot.decodeJid(targetJid)) : false;
            },
        };
    }

    // --- Core Implementations ---

    async getMetadata(bot: Bot, groupJid: string): Promise<Partial<GroupMetadata>> {
        try {
            if (!bot.groupMetadata) throw new Error('Bot does not support groupMetadata');
            return await bot.groupMetadata(groupJid);
        } catch (error) {
            logger.error(`GroupService.getMetadata failed for ${groupJid}`, error);
            return {};
        }
    }

    async getMembers(bot: Bot, groupJid: string): Promise<string[]> {
        const metadata = await this.getMetadata(bot, groupJid);
        if ('participants' in metadata && metadata.participants) {
            return metadata.participants.map((p) => p.id);
        }
        return [];
    }

    async isAdmin(bot: Bot, groupJid: string, userJid: string): Promise<boolean> {
        const metadata = await this.getMetadata(bot, groupJid);
        if ('participants' in metadata && metadata.participants) {
            const participant = metadata.participants.find((p) => p.id === userJid);
            return !!(participant && participant.admin);
        }
        return false;
    }

    async matchAdmin(bot: Bot, groupJid: string, userJid: string): Promise<boolean> {
        return this.isAdmin(bot, groupJid, userJid);
    }

    async isBotAdmin(bot: Bot, groupJid: string): Promise<boolean> {
        const botId = bot.user?.id ? bot.decodeJid(bot.user.id) : undefined;
        if (!botId) return false;
        return this.isAdmin(bot, groupJid, botId);
    }

    async getOwner(bot: Bot, groupJid: string): Promise<string | null> {
        const metadata = await this.getMetadata(bot, groupJid);
        if ('owner' in metadata) {
            return metadata.owner || metadata.subjectOwner || null;
        }
        return null;
    }

    async getName(bot: Bot, groupJid: string): Promise<string> {
        const metadata = await this.getMetadata(bot, groupJid);
        if ('subject' in metadata && metadata.subject) {
            return metadata.subject;
        }
        return 'Unknown Group';
    }

    // --- Actions ---

    async addParticipants(bot: Bot, groupJid: string, jids: string[]) {
        try {
            if (!bot.groupParticipantsUpdate) throw new Error('Method not supported');
            return await bot.groupParticipantsUpdate(groupJid, jids, 'add');
        } catch (error) {
            logger.error(`GroupService.add failed`, error);
            return { error };
        }
    }

    async removeParticipants(bot: Bot, groupJid: string, jids: string[]) {
        try {
            if (!bot.groupParticipantsUpdate) throw new Error('Method not supported');
            return await bot.groupParticipantsUpdate(groupJid, jids, 'remove');
        } catch (error) {
            logger.error(`GroupService.remove failed`, error);
            return { error };
        }
    }

    async promoteParticipants(bot: Bot, groupJid: string, jids: string[]) {
        try {
            if (!bot.groupParticipantsUpdate) throw new Error('Method not supported');
            return await bot.groupParticipantsUpdate(groupJid, jids, 'promote');
        } catch (error) {
            logger.error(`GroupService.promote failed`, error);
            return { error };
        }
    }

    async demoteParticipants(bot: Bot, groupJid: string, jids: string[]) {
        try {
            if (!bot.groupParticipantsUpdate) throw new Error('Method not supported');
            return await bot.groupParticipantsUpdate(groupJid, jids, 'demote');
        } catch (error) {
            logger.error(`GroupService.demote failed`, error);
            return { error };
        }
    }

    async updateSubject(bot: Bot, groupJid: string, subject: string) {
        try {
            if (!bot.groupUpdateSubject) throw new Error('Method not supported');
            return await bot.groupUpdateSubject(groupJid, subject);
        } catch (error) {
            logger.error(`GroupService.updateSubject failed`, error);
            return { error };
        }
    }

    async updateDescription(bot: Bot, groupJid: string, description: string) {
        try {
            if (!bot.groupUpdateDescription) throw new Error('Method not supported');
            return await bot.groupUpdateDescription(groupJid, description);
        } catch (error) {
            logger.error(`GroupService.updateDescription failed`, error);
            return { error };
        }
    }

    async updateSetting(bot: Bot, groupJid: string, setting: 'announcement' | 'locked', value: boolean) {
        try {
            if (!bot.groupSettingUpdate) throw new Error('Method not supported');
            // Baileys 'groupSettingUpdate' handling
            // Map our logical setting to Baileys expected string
            let action: 'announcement' | 'not_announcement' | 'locked' | 'unlocked' | null = null;

            if (setting === 'announcement') {
                action = value ? 'announcement' : 'not_announcement';
            } else if (setting === 'locked') {
                action = value ? 'locked' : 'unlocked';
            }

            if (action) {
                await bot.groupSettingUpdate(groupJid, action);
                this.syncGroup(bot, groupJid); // Optimistic sync
                return;
            }
        } catch (error) {
            logger.error(`GroupService.updateSetting failed to set ${setting} to ${value}`, error);
            return { error };
        }
    }

    async updateMemberAddMode(bot: Bot, groupJid: string, mode: boolean | 'on' | 'off') {
        try {
            if (!bot.groupMemberAddMode) throw new Error('Method not supported');
            const isEnable = typeof mode === 'boolean' ? mode : mode === 'on';
            await bot.groupMemberAddMode(groupJid, isEnable ? 'all_member_add' : 'admin_add');
            return { success: true };
        } catch (error) {
            logger.error(`GroupService.updateMemberAddMode failed`, error);
            return { error };
        }
    }

    async getInviteCode(bot: Bot, groupJid: string): Promise<string> {
        try {
            if (!bot.groupInviteCode) throw new Error('Method not supported');
            return await bot.groupInviteCode(groupJid) || '';
        } catch (error) {
            logger.error(`GroupService.getInviteCode failed`, error);
            return '';
        }
    }

    // --- Persistence & Sync ---

    /**
     * Syncs group metadata from Baileys to Firestore
     * Uses Tenant-Scoped path: tenants/{tenantId}/groups/{groupJid}
     */
    async syncGroup(bot: Bot, groupJid: string): Promise<void> {
        try {
            const { databaseService } = bot.context;
            if (!databaseService) return;

            const metadata = await this.getMetadata(bot, groupJid);
            if (!metadata || !metadata.id) return;

            const participants = metadata.participants || [];
            const admins = participants.filter(p => p.admin).map(p => p.id);
            const memberIds = participants.map(p => p.id);

            const groupData = {
                id: metadata.id,
                subject: metadata.subject || 'Unknown Group',
                owner: metadata.owner || metadata.subjectOwner || null,
                creation: metadata.creation ? new Date(metadata.creation * 1000) : new Date(),
                desc: metadata.desc?.toString() || '',
                participants: memberIds,
                admins: admins,
                settings: {
                    announcement: metadata.announce || false,
                    locked: metadata.restrict || false
                },
                updatedAt: new Date(),
                syncedAt: new Date()
            };

            await databaseService.setDoc(
                'groups', // Collection name relative to tenant
                groupJid,
                groupData,
                bot.tenantId
            );

            logger.info(`Synced group ${metadata.subject} (${groupJid}) for tenant ${bot.tenantId}`);

        } catch (error: unknown) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error(`GroupService.syncGroup failed for ${groupJid}`, err);
        }
    }
}

export const groupService = new GroupService();

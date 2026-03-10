import { Job } from 'bullmq';
import jobQueueService from '../services/jobQueue.js';
import logger from '../utils/logger.js';
import { channelManager } from '../services/channels/ChannelManager.js';
import { WhatsappAdapter } from '../services/channels/whatsapp/WhatsappAdapter.js';

/**
 * Worker to process outbound WhatsApp messages with human-like delays
 */
export const initializeWhatsappWorker = () => {
    logger.info('Initializing WhatsApp Outbound Worker...');

    jobQueueService.process('whatsapp-outbound', async (job: Job) => {
        const { tenantId, channelId, jid, message, options } = job.data;

        logger.info(`Processing outbound WhatsApp message for ${jid} (Job: ${job.id})`);

        try {
            const adapter = channelManager.getAdapter(channelId) as WhatsappAdapter;
            if (!adapter) {
                throw new Error(`Adapter for channel ${channelId} not found in memory`);
            }

            // 1. Calculate a human-like delay based on message length
            // Base delay 2s + 50ms per character, capped at 10s
            const textLength = typeof message === 'string' ? message.length : 10;
            const baseDelay = 2000 + Math.min(textLength * 50, 8000);
            // Add randomness (+/- 20%)
            const jitter = baseDelay * (0.8 + Math.random() * 0.4);

            logger.debug(`Simulating typing for ${Math.round(jitter)}ms...`);

            // 2. Clear presence and set "composing"
            await adapter.getSocket()?.sendPresenceUpdate('composing', jid);

            // 3. Wait the duration
            await new Promise(resolve => setTimeout(resolve, jitter));

            // 4. Stop typing and send
            await adapter.getSocket()?.sendPresenceUpdate('paused', jid);

            // Use the internal send method to actually dispatch
            // Note: We'll modify WhatsappAdapter to have a _directSend method
            await (adapter as any)._directSendMessage(jid, message, options);

            logger.info(`Successfully dispatched message to ${jid} via queue`);
            return { success: true };
        } catch (error: any) {
            logger.error(`Failed to process WhatsApp job ${job.id}:`, error);
            throw error; // Let BullMQ handle retries
        }
    });
};

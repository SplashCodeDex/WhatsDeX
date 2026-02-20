import { describe, it, expect } from 'vitest';
import { OmnichannelMessageSchema } from './types';

describe('Omnichannel Message Schema', () => {
    it('should validate a valid omnichannel message', () => {
        const validMessage = {
            id: 'msg_123',
            channelId: 'whatsapp_1',
            channelType: 'whatsapp',
            agentId: 'agent_456',
            remoteJid: '1234567890@s.whatsapp.net',
            fromMe: true,
            type: 'text',
            content: 'Hello from WhatsDeX!',
            status: 'sent',
            timestamp: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const result = OmnichannelMessageSchema.safeParse(validMessage);
        expect(result.success).toBe(true);
    });

    it('should allow optional agentId', () => {
        const messageWithoutAgent = {
            id: 'msg_789',
            channelId: 'telegram_1',
            channelType: 'telegram',
            remoteJid: 'user_999',
            fromMe: false,
            type: 'text',
            content: 'Inbound message',
            status: 'delivered',
            timestamp: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const result = OmnichannelMessageSchema.safeParse(messageWithoutAgent);
        expect(result.success).toBe(true);
    });

    it('should fail on missing channelType', () => {
        const invalidMessage = {
            id: 'msg_abc',
            content: 'Missing channel info'
        };
        const result = OmnichannelMessageSchema.safeParse(invalidMessage);
        expect(result.success).toBe(false);
    });
});

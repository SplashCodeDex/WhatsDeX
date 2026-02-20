import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { MessageController } from './messageController.js';
import multiTenantBotService from '../services/multiTenantBotService.js';
import { db } from '../lib/firebase.js';

// Mock dependencies
vi.mock('../services/multiTenantBotService.js', () => ({
  default: {
    sendMessage: vi.fn(),
  },
}));

vi.mock('../lib/firebase.js', () => ({
  db: {
    collection: vi.fn().mockReturnThis(),
    doc: vi.fn().mockReturnThis(),
    get: vi.fn(),
  },
}));

vi.mock('../utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('MessageController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = {
      user: { tenantId: 'tenant-123' } as any,
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  describe('reply', () => {
    it('should send a reply via the last interacting bot', async () => {
      mockReq.body = {
        messageId: 'msg-original',
        text: 'This is a reply'
      };

      // Mock fetching the original message to find botId and sender
      (db.collection('').doc('').get as any).mockResolvedValue({
        exists: true,
        data: () => ({ 
          botId: 'bot-456', 
          remoteJid: 'user-789@s.whatsapp.net',
          channelType: 'whatsapp' 
        }),
      });

      (multiTenantBotService.sendMessage as any).mockResolvedValue({ success: true });

      await (MessageController as any).reply(mockReq as Request, mockRes as Response);

      expect(multiTenantBotService.sendMessage).toHaveBeenCalledWith(
        'tenant-123',
        'bot-456',
        expect.objectContaining({
          to: 'user-789@s.whatsapp.net',
          text: 'This is a reply'
        })
      );
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 404 if original message not found', async () => {
      mockReq.body = { messageId: 'missing', text: 'hi' };
      (db.collection('').doc('').get as any).mockResolvedValue({ exists: false });

      await (MessageController as any).reply(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });
});

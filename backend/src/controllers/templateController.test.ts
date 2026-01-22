import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { createTemplateController, getTemplatesController, spinMessageController } from './templateController.js';
import { TemplateService } from '../services/templateService.js';

// Hoist mocks
const { mockTemplateService, mockGeminiAI } = vi.hoisted(() => ({
    mockTemplateService: {
        createTemplate: vi.fn(),
        getTemplates: vi.fn()
    },
    mockGeminiAI: {
        spinMessage: vi.fn()
    }
}));

// Mock Services
vi.mock('../services/templateService.js', () => ({
    TemplateService: {
        getInstance: () => mockTemplateService
    }
}));

vi.mock('../services/geminiAI.js', () => {
    return {
        GeminiAI: vi.fn().mockImplementation(function() {
            return mockGeminiAI;
        }),
        default: vi.fn().mockImplementation(function() {
            return mockGeminiAI;
        })
    };
});

describe('TemplateController', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;

    beforeEach(() => {
        vi.clearAllMocks();
        mockReq = {
            body: {},
            user: { tenantId: 'tenant-1' } as any
        };
        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };
    });

    describe('createTemplateController', () => {
        it('should create template', async () => {
            mockReq.body = { name: 'T1', content: 'C1' };
            mockTemplateService.createTemplate.mockResolvedValue({ success: true, data: { id: '1' } });

            await createTemplateController(mockReq as Request, mockRes as Response);

            expect(mockTemplateService.createTemplate).toHaveBeenCalled();
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });

    describe('spinMessageController', () => {
        it('should spin message', async () => {
            mockReq.body = { content: 'Hello {{name}}' };
            mockGeminiAI.spinMessage.mockResolvedValue({ success: true, data: 'Hi {{name}}' });

            await spinMessageController(mockReq as Request, mockRes as Response);

            expect(mockGeminiAI.spinMessage).toHaveBeenCalledWith('Hello {{name}}', 'tenant-1');
            expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: 'Hi {{name}}' });
        });
    });
});
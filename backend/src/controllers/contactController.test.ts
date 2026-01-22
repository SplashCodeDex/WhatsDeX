import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { importContactsController } from './contactController.js';
import { ContactService } from '../services/contactService.js';

// Mock ContactService
const mockContactService = {
    importContacts: vi.fn()
};

vi.mock('../services/contactService.js', () => ({
    ContactService: {
        getInstance: () => mockContactService
    }
}));

describe('ContactController', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;

    beforeEach(() => {
        vi.clearAllMocks();
        mockReq = {
            body: {
                csvData: 'name,phone\nTest,12345'
            },
            user: {
                tenantId: 'tenant-1'
            } as any
        };
        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };
    });

    describe('importContactsController', () => {
        it('should call service and return result', async () => {
            mockContactService.importContacts.mockResolvedValue({
                success: true,
                data: { count: 1, errors: [] }
            });

            await importContactsController(mockReq as Request, mockRes as Response);

            expect(mockContactService.importContacts).toHaveBeenCalledWith('tenant-1', 'name,phone\nTest,12345');
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: { count: 1, errors: [] }
            });
        });

        it('should handle service errors', async () => {
             mockContactService.importContacts.mockResolvedValue({
                success: false,
                error: new Error('Failed')
            });

            await importContactsController(mockReq as Request, mockRes as Response);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
        });
        
        it('should require csvData', async () => {
             mockReq.body.csvData = undefined;
             
             await importContactsController(mockReq as Request, mockRes as Response);
             
             expect(mockRes.status).toHaveBeenCalledWith(400);
        });
    });
});

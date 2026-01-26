import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { Readable } from 'stream';
import { ContactController } from './contactController.js';
import { ContactService } from '../services/contactService.js';
import { promises as fs } from 'fs';

// Mock ContactService
const mockContactService = {
    importContacts: vi.fn()
};

vi.mock('../services/contactService.js', () => ({
    ContactService: {
        getInstance: () => mockContactService
    }
}));

vi.mock('fs', () => ({
    promises: {
        unlink: vi.fn().mockResolvedValue(undefined),
    },
    createReadStream: vi.fn(() => new Readable({
        read() {
            this.push('name,phone\nTest,12345');
            this.push(null);
        }
    })),
}));

describe('ContactController', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;

    beforeEach(() => {
        vi.clearAllMocks();
        mockReq = {
            file: {
                path: '/tmp/test.csv',
            } as Express.Multer.File,
            user: {
                tenantId: 'tenant-1'
            } as any
        };
        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };
    });

    describe('importContacts', () => {
        it('should call service and return result', async () => {
            mockContactService.importContacts.mockResolvedValue({
                success: true,
                data: { count: 1, errors: [] }
            });

            await ContactController.importContacts(mockReq as Request, mockRes as Response);

            expect(mockContactService.importContacts).toHaveBeenCalledWith('tenant-1', expect.any(Readable));
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

            await ContactController.importContacts(mockReq as Request, mockRes as Response);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
        });

        it('should require a file', async () => {
             mockReq.file = undefined;

             await ContactController.importContacts(mockReq as Request, mockRes as Response);

             expect(mockRes.status).toHaveBeenCalledWith(400);
             expect(mockRes.json).toHaveBeenCalledWith({ success: false, error: 'CSV file is required' });
        });

        it('should delete the temporary file after import', async () => {
            mockContactService.importContacts.mockResolvedValue({
                success: true,
                data: { count: 1, errors: [] }
            });

            await ContactController.importContacts(mockReq as Request, mockRes as Response);

            expect(fs.unlink).toHaveBeenCalledWith('/tmp/test.csv');
        });
    });
});

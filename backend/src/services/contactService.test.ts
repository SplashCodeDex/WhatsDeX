import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContactService } from './contactService.js';
import { db } from '../lib/firebase.js';

const { mockBatchSet, mockBatchCommit, mockBatch } = vi.hoisted(() => {
    const mockBatchSet = vi.fn();
    const mockBatchCommit = vi.fn().mockResolvedValue(undefined);
    const mockBatch = vi.fn(() => ({
        set: mockBatchSet,
        commit: mockBatchCommit,
    }));
    return { mockBatchSet, mockBatchCommit, mockBatch };
});

vi.mock('../lib/firebase.js', () => {
    const mockDoc = vi.fn(() => ({}));
    const mockCollection = vi.fn(() => ({
        doc: mockDoc,
    }));
    const mockDb = {
        batch: mockBatch,
        collection: vi.fn(() => ({
            doc: vi.fn(() => ({
                collection: mockCollection,
            })),
        })),
    };
    return { db: mockDb };
});

import { Readable } from 'stream';

const { mockCreateReadStream, mockUnlink } = vi.hoisted(() => {
    return {
        mockCreateReadStream: vi.fn(),
        mockUnlink: vi.fn((path, callback) => callback()),
    }
});

vi.mock('fs', () => ({
    default: {
        createReadStream: mockCreateReadStream,
        unlink: mockUnlink,
    },
    createReadStream: mockCreateReadStream,
    unlink: mockUnlink,
}));

describe('ContactService', () => {
    let service: ContactService;
    const mockFilePath = '/tmp/test.csv';
    const tenantId = 'tenant_123';

    beforeEach(() => {
        vi.clearAllMocks();
        service = ContactService.getInstance();
    });

    const createMockStream = (content: string) => {
        const stream = new Readable();
        stream.push(content);
        stream.push(null); // Signal end of stream
        return stream;
    };

    describe('importContacts', () => {
        it('should correctly parse CSV stream and save contacts', async () => {
            const csvData = `name,phoneNumber,email,tags\n"Doe, John","(123) 456-7890",john@example.com,"vip|lead"\nJane Doe,+1-987-654-3210,jane@example.com,new`;
            const mockStream = createMockStream(csvData);
            mockCreateReadStream.mockReturnValue(mockStream);

            const result = await service.importContacts(tenantId, mockFilePath);

            expect(result.success).toBe(true);
            if (!result.success) return;

            expect(result.data.count).toBe(2);
            expect(result.data.errors).toEqual([]);
            expect(mockBatchCommit).toHaveBeenCalledTimes(1);
            expect(mockBatchSet).toHaveBeenCalledTimes(2);
            expect(mockUnlink).toHaveBeenCalledWith(mockFilePath, expect.any(Function));
        });

        it('should handle invalid rows in the stream gracefully', async () => {
            const csvData = `name,phone\nValid User,1234567890\nInvalid User,`;
            const mockStream = createMockStream(csvData);
            mockCreateReadStream.mockReturnValue(mockStream);

            const result = await service.importContacts(tenantId, mockFilePath);

            expect(result.success).toBe(true);
            if (!result.success) return;

            expect(result.data.count).toBe(1);
            expect(result.data.errors.length).toBe(1);
            expect(result.data.errors[0]).toContain('Row 3: phone: Phone number is required');
            expect(mockBatchCommit).toHaveBeenCalledTimes(1);
            expect(mockUnlink).toHaveBeenCalledWith(mockFilePath, expect.any(Function));
        });

        it('should handle CSV parsing errors and clean up the file', async () => {
            const readStream = new Readable();
            readStream._read = () => {}; // No-op to prevent errors
            mockCreateReadStream.mockReturnValue(readStream);

            // Push some data to start the stream, then emit an error
            readStream.push('name,phone\n');
            const error = new Error('Invalid CSV headers.');
            (error as any).code = 'CSV_INVALID_COLUMN_NAME';

            // Defer the error emission to ensure the pipeline is running
            process.nextTick(() => {
                readStream.emit('error', error);
            });

            const result = await service.importContacts(tenantId, mockFilePath);

            expect(result.success).toBe(false);
            if (result.success) return; // Guard for type safety

            expect(result.error.message).toContain('Invalid CSV headers');
            expect(mockUnlink).toHaveBeenCalledWith(mockFilePath, expect.any(Function));
        });
    });
});

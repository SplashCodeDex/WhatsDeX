import { describe, it, expect, beforeEach, vi } from 'vitest';
import { statsAggregatorJob } from './statsAggregatorJob.js';
import { firebaseService } from '../services/FirebaseService.js';
import { db } from '../lib/firebase.js';

// Mock dependencies
const { mockFirebase, mockDb } = vi.hoisted(() => ({
    mockFirebase: {
        setDoc: vi.fn().mockResolvedValue(undefined),
        getDoc: vi.fn(),
        getCollection: vi.fn(),
    },
    mockDb: {
        collection: vi.fn(),
    }
}));

vi.mock('../services/FirebaseService.js', () => ({
    firebaseService: mockFirebase,
    FirebaseService: { getInstance: () => mockFirebase }
}));

vi.mock('../lib/firebase.js', () => ({
    db: mockDb,
    admin: {
        firestore: {
            FieldValue: {
                increment: vi.fn()
            }
        }
    }
}));

vi.mock('firebase-admin/firestore', () => ({
    Timestamp: {
        fromDate: vi.fn().mockImplementation((d: Date) => ({ toDate: () => d }))
    }
}));

vi.mock('bullmq', () => ({
    Worker: vi.fn().mockImplementation(function() {
        return { on: vi.fn() };
    }),
    Job: vi.fn()
}));

describe('StatsAggregatorJob', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should aggregate command_usage and save to analytics', async () => {
        const tenantId = 'tenant_1';
        const date = '2026-02-19';

        const mockTenants = {
            docs: [{ id: 'tenant_1' }]
        };

        const mockCommandUsage = [
            { data: () => ({ command: 'menu', category: 'main', success: true }) },
            { data: () => ({ command: 'gemini', category: 'ai-chat', success: true }) },
            { data: () => ({ command: 'sticker', category: 'tools', success: false }) }
        ];

        mockDb.collection.mockImplementation((path: string) => {
            if (path === 'tenants') {
                return { get: vi.fn().mockResolvedValue(mockTenants) };
            }
            if (path.includes('command_usage')) {
                return {
                    where: vi.fn().mockReturnThis(),
                    get: vi.fn().mockResolvedValue(mockCommandUsage)
                };
            }
            return { get: vi.fn() };
        });

        const worker = statsAggregatorJob as any;
        await worker.performRollup({ data: { tenantId, date } });

        expect(mockFirebase.setDoc).toHaveBeenCalledWith(
            'analytics',
            date,
            expect.objectContaining({
                date,
                totalCommands: 3,
                aiRequests: 1
            }),
            tenantId,
            true
        );
    });

    it('should process all tenants if no tenantId provided', async () => {
        const date = '2026-02-19';

        const mockTenants = {
            docs: [
                { id: 'tenant_1' },
                { id: 'tenant_2' }
            ]
        };

        mockDb.collection.mockImplementation((path: string) => {
            if (path === 'tenants') {
                return { get: vi.fn().mockResolvedValue(mockTenants) };
            }
            if (path.includes('command_usage')) {
                return {
                    where: vi.fn().mockReturnThis(),
                    get: vi.fn().mockResolvedValue([])
                };
            }
            return { get: vi.fn() };
        });

        const worker = statsAggregatorJob as any;
        await worker.performRollup({ data: { date } });

        expect(mockFirebase.setDoc).toHaveBeenCalledTimes(2);
        expect(mockFirebase.setDoc).toHaveBeenCalledWith('analytics', date, expect.any(Object), 'tenant_1', true);
        expect(mockFirebase.setDoc).toHaveBeenCalledWith('analytics', date, expect.any(Object), 'tenant_2', true);
    });
});

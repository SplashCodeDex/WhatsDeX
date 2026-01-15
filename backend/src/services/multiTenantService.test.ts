import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MultiTenantService } from '@/services/multiTenantService.js';
import { FirebaseService } from '@/services/FirebaseService.js';

// Hoist mocks
const { mockFirebaseService } = vi.hoisted(() => {
    return {
        mockFirebaseService: {
            getInstance: vi.fn(),
            getDoc: vi.fn(),
            getCollection: vi.fn(),
        }
    };
});

// Mock dependencies
vi.mock('@/services/FirebaseService.js', () => ({
    firebaseService: { // Mock the exported instance directly if possible, or the class
        getDoc: mockFirebaseService.getDoc,
        getCollection: mockFirebaseService.getCollection,
    },
    FirebaseService: {
        getInstance: () => ({
            getDoc: mockFirebaseService.getDoc,
            getCollection: mockFirebaseService.getCollection,
        })
    }
}));

// Mock logger to suppress errors
vi.mock('@/utils/logger.js', () => ({
    default: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
    },
}));

describe('MultiTenantService', () => {
    let service: MultiTenantService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = MultiTenantService.getInstance();
    });

    describe('canAddBot', () => {
        it('should return true if bot count is less than maxBots', async () => {
            // Mock Tenant with pro plan (maxBots = 3)
            mockFirebaseService.getDoc.mockResolvedValueOnce({
                id: 'tenant-1',
                name: 'Test Tenant',
                plan: 'pro',
                planTier: 'pro',
                status: 'active',
                subscriptionStatus: 'active',
                createdAt: new Date(),
                updatedAt: new Date(),
                settings: { aiEnabled: true }
            });

            // Mock existing bots (count = 1)
            mockFirebaseService.getCollection.mockResolvedValueOnce([
                { id: 'bot-1' }
            ]);

            const result = await service.canAddBot('tenant-1');
            if (!result.success) console.error('Test Failed Error:', result.error);
            expect(result.success).toBe(true);
            expect(result.data).toBe(true);
        });

        it('should return false if bot count equals maxBots', async () => {
            // Mock Tenant with starter plan (maxBots = 1)
            mockFirebaseService.getDoc.mockResolvedValueOnce({
                id: 'tenant-1',
                name: 'Test Tenant',
                plan: 'starter',
                planTier: 'starter',
                status: 'active',
                subscriptionStatus: 'active',
                createdAt: new Date(),
                updatedAt: new Date(),
                settings: { aiEnabled: false }
            });

            // Mock existing bots (count = 1)
            mockFirebaseService.getCollection.mockResolvedValueOnce([
                { id: 'bot-1' }
            ]);

            const result = await service.canAddBot('tenant-1');
            expect(result.success).toBe(true); // check executed successfully
            expect(result.data).toBe(false); // but user cannot add bot
        });

        it('should handle missing settings and default to 1 bot', async () => {
            // Mock Tenant with missing plan (defaults to starter)
            mockFirebaseService.getDoc.mockResolvedValueOnce({
                id: 'tenant-1',
                name: 'Test Tenant',
                plan: 'starter',
                planTier: 'starter',
                status: 'active',
                subscriptionStatus: 'active',
                createdAt: new Date(),
                updatedAt: new Date(),
                // missing settings
                settings: { }
            });

            mockFirebaseService.getCollection.mockResolvedValueOnce([
                { id: 'bot-1' }
            ]);

            const result = await service.canAddBot('tenant-1');
            // Default maxBots is 1. Existing is 1. Should be false.
            expect(result.success).toBe(true);
            expect(result.data).toBe(false);
        });

        it('should return error if tenant not found', async () => {
            mockFirebaseService.getDoc.mockResolvedValueOnce(null);

            const result = await service.canAddBot('tenant-missing');
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });
});

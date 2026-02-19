import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCreateAgent } from './useCreateAgent';
import { useAuth } from '@/features/auth';
import { getClientFirestore } from '@/lib/firebase/client';
import { runTransaction } from 'firebase/firestore';

// Mock Auth
vi.mock('@/features/auth', () => ({
    useAuth: vi.fn(),
}));

// Mock Firebase
vi.mock('@/lib/firebase/client', () => ({
    getClientFirestore: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
    runTransaction: vi.fn(),
    doc: vi.fn(),
    collection: vi.fn(),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    serverTimestamp: vi.fn(() => 'mock-timestamp'),
}));

describe('useCreateAgent', () => {
    const mockUser = { id: 'user_123', tenantId: 'tenant_123', planTier: 'starter' };
    const mockAgentData = {
        name: 'Test Agent',
        emoji: '🤖',
        systemPrompt: 'You are a test agent.',
        model: 'gemini-1.5-flash' as const,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as any).mockReturnValue({ user: mockUser });
        (getClientFirestore as any).mockReturnValue({});
    });

    it('should fail if user is not authenticated', async () => {
        (useAuth as any).mockReturnValue({ user: null });
        const { result } = renderHook(() => useCreateAgent());
        
        let response;
        await act(async () => {
            response = await result.current.createAgent(mockAgentData);
        });
        
        expect(response.success).toBe(false);
        if (!response.success) {
            expect(response.error.code).toBe('unauthorized');
        }
    });

    it('should fail if Starter plan already has 1 agent', async () => {
        (useAuth as any).mockReturnValue({ user: { ...mockUser, planTier: 'starter' } });
        
        // Mock transaction to show 1 existing agent
        (runTransaction as any).mockImplementation(async (db, cb) => {
            return cb({
                get: vi.fn().mockResolvedValue({
                    exists: () => true,
                    data: () => ({ agentCount: 1 })
                }),
                set: vi.fn(),
            });
        });

        const { result } = renderHook(() => useCreateAgent());
        
        let response;
        await act(async () => {
            response = await result.current.createAgent(mockAgentData);
        });

        expect(response.success).toBe(false);
        if (!response.success) {
            expect(response.error.code).toBe('tier_limit_reached');
            expect(response.error.message).toContain('Starter plan');
        }
    });

    it('should succeed if Pro plan has < 5 agents', async () => {
        (useAuth as any).mockReturnValue({ user: { ...mockUser, planTier: 'pro' } });
        
        // Mock transaction to show 2 existing agents (limit is 5)
        (runTransaction as any).mockImplementation(async (db, cb) => {
            return cb({
                get: vi.fn().mockResolvedValue({
                    exists: () => true,
                    data: () => ({ agentCount: 2 })
                }),
                set: vi.fn(),
                update: vi.fn(),
            });
        });

        const { result } = renderHook(() => useCreateAgent());
        
        let response;
        await act(async () => {
            response = await result.current.createAgent(mockAgentData);
        });

        expect(response.success).toBe(true);
    });
});

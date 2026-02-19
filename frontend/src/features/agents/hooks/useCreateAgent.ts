import { useState, useCallback } from 'react';
import { useAuth } from '@/features/auth';
import { getClientFirestore } from '@/lib/firebase/client';
import { 
    runTransaction, 
    doc, 
    collection, 
    serverTimestamp,
    type Transaction
} from 'firebase/firestore';
import { type Agent, type AIModel } from '../types';
import { type Result } from '@/types/api';
import { logger } from '@/lib/logger';

const TIER_LIMITS = {
    starter: 1,
    pro: 5,
    enterprise: 100, // Effectively unlimited
};

interface CreateAgentInput {
    name: string;
    emoji: string;
    systemPrompt: string;
    model: AIModel;
}

/**
 * Hook for creating a new Unified Agent with tier-limit enforcement.
 */
export function useCreateAgent() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const createAgent = useCallback(async (
        input: CreateAgentInput
    ): Promise<Result<string>> => {
        if (!user) {
            return {
                success: false,
                error: { code: 'unauthorized', message: 'User must be authenticated' }
            };
        }

        const tenantId = user.tenantId || `user_${user.id}`;
        const tier = user.planTier || 'starter';
        const limit = TIER_LIMITS[tier];

        setIsLoading(true);
        const db = getClientFirestore();

        try {
            const agentId = `agent_${Math.random().toString(36).substring(2, 11)}`;
            
            await runTransaction(db, async (transaction: Transaction) => {
                // Check current agent count for the tenant
                const counterRef = doc(db, `tenants/${tenantId}/metadata/counters`);
                const counterSnap = await transaction.get(counterRef);
                
                const currentCount = counterSnap.exists() ? counterSnap.data().agentCount || 0 : 0;

                if (currentCount >= limit) {
                    const tierDisplay = tier.charAt(0).toUpperCase() + tier.slice(1);
                    throw new Error(`Tier limit reached. Your ${tierDisplay} plan allows only ${limit} agent(s).`);
                }

                // Create agent doc
                const agentRef = doc(db, `tenants/${tenantId}/agents/${agentId}`);
                transaction.set(agentRef, {
                    ...input,
                    id: agentId,
                    tenantId,
                    planTier: tier,
                    status: 'active',
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });

                // Update counter
                transaction.set(counterRef, { agentCount: currentCount + 1 }, { merge: true });
            });

            return {
                success: true,
                data: agentId,
                message: 'Agent created successfully'
            };
        } catch (error: any) {
            logger.error('Failed to create agent:', error);
            
            const isLimitError = error.message.includes('Tier limit reached');
            
            return {
                success: false,
                error: { 
                    code: isLimitError ? 'tier_limit_reached' : 'internal_error', 
                    message: error.message || 'Failed to create agent' 
                }
            };
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    return {
        createAgent,
        isLoading
    };
}

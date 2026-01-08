import { useState, useCallback } from 'react';
import { subscriptionService } from '@/services/subscriptionService';
import { toast } from '@/hooks/use-toast';

export function useSubscription() {
    const [subscription, setSubscription] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchSubscription = useCallback(async () => {
        setLoading(true);
        try {
            const response = await subscriptionService.getSubscription();
            setSubscription(response);
        } catch (err: any) {
            console.error(err);
            // Silent fail for ecosystem consistency or show toast if critical
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        subscription,
        loading,
        fetchSubscription
    };
}

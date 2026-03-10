import { useState, useEffect } from 'react';
import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export function useChannelStatus(channelId: string, agentId: string = 'system_default', enabled: boolean = false) {
    const [status, setStatus] = useState<any>(null);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!enabled || !channelId) {
            setStatus(null);
            setQrCode(null);
            return;
        }

        let interval: NodeJS.Timeout;
        let isMounted = true;

        const poll = async () => {
            if (!isMounted) return;
            
            try {
                // Poll Status
                const statusRes = await api.get<any>(API_ENDPOINTS.OMNICHANNEL.AGENTS.CHANNELS.STATUS(agentId, channelId));
                
                if (!isMounted) return;

                if (statusRes.success) {
                    setStatus(statusRes.data);
                    setError(null);
                    
                    // If we need QR (connecting status or explicitly has QR)
                    if (statusRes.data.status === 'connecting' || statusRes.data.status === 'initializing' || statusRes.data.hasQR) {
                        const qrRes = await api.get<any>(API_ENDPOINTS.OMNICHANNEL.AGENTS.CHANNELS.QR_CODE(agentId, channelId));
                        
                        if (!isMounted) return;

                        if (qrRes.success && qrRes.data.qrCode) {
                            setQrCode(qrRes.data.qrCode);
                        } else {
                            setQrCode(null);
                        }
                    } else {
                        setQrCode(null);
                    }
                } else {
                    setError(statusRes.error?.message || 'Failed to fetch status');
                }
            } catch (err) {
                if (isMounted) {
                    setError('Polling error');
                    console.error('[useChannelStatus] Polling error', err);
                }
            }
        };

        setIsLoading(true);
        poll().finally(() => {
            if (isMounted) setIsLoading(false);
        });

        interval = setInterval(poll, 5000); // Poll every 5s

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [channelId, agentId, enabled]);

    return { status, qrCode, isLoading, error };
}

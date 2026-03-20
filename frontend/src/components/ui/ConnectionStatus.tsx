'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { circuitBreaker } from '@/lib/api/apiCircuitBreaker';
import { Button } from '@/components/ui/button';

export function ConnectionStatus() {
    const [status, setStatus] = useState<'CLOSED' | 'OPEN' | 'HALF_OPEN'>(
        circuitBreaker.getState('omnichannel')
    );

    useEffect(() => {
        const unsubscribe = circuitBreaker.subscribe((group, newState) => {
            if (group === 'omnichannel' || group === 'auth') {
                setStatus(newState);
            }
        });
        return () => { unsubscribe(); };
    }, []);

    if (status === 'CLOSED') {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="w-full bg-destructive/10 border-b border-destructive/20"
            >
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-destructive">
                        {status === 'OPEN' ? (
                            <WifiOff className="h-5 w-5" />
                        ) : (
                            <RefreshCw className="h-5 w-5 animate-spin" />
                        )}
                        <div className="flex flex-col">
                            <span className="font-semibold text-sm">
                                {status === 'OPEN' ? 'Connection Lost' : 'Reconnecting...'}
                            </span>
                            <span className="text-xs opacity-90">
                                {status === 'OPEN' 
                                    ? 'The autonomous engine is currently unreachable. Retrying automatically.' 
                                    : 'Attempting to re-establish connection to the omnichannel mesh.'}
                            </span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

'use client';

import { useState } from 'react';
import { QrCode, RefreshCcw } from 'lucide-react';
import { useBotQR } from '@/features/bots/hooks';
import { Button } from '@/components/ui/button';

interface QRCodeDisplayProps {
    botId: string;
    agentId?: string;
    isGenerating: boolean;
    onGenerate: () => void;
}

export function QRCodeDisplay({ botId, agentId = 'system_default', isGenerating, onGenerate }: QRCodeDisplayProps) {
    const { data: qrData, isFetching: isQRLoading, error } = useBotQR(botId, isGenerating, agentId);

    if (!isGenerating) {
        return (
            <div className="flex flex-col items-center justify-center p-6 space-y-4 h-full">
                <div className="flex h-48 w-48 items-center justify-center rounded-lg border-2 border-dashed bg-muted/30 mb-4">
                    <QrCode className="h-12 w-12 opacity-20" />
                </div>
                <Button onClick={onGenerate} className="w-full max-w-[200px]">
                    Generate QR Code
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center p-6 space-y-4">
            {qrData?.qrCode ? (
                // Assuming backend returns a Data URI (base64 string)
                <div className="relative h-64 w-64 border-2 border-primary/20 rounded-lg p-2 bg-white">
                    <img
                        src={qrData.qrCode}
                        alt="Scan Me"
                        className="h-full w-full object-contain"
                    />
                </div>
            ) : (
                <div className="flex h-64 w-64 items-center justify-center rounded-lg border-2 border-dashed bg-muted/30">
                    {isQRLoading ? (
                        <div className="flex flex-col items-center gap-2">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                            <span className="text-sm text-muted-foreground animate-pulse">Generating new QR Code...</span>
                        </div>
                    ) : error ? (
                        <div className="text-center px-4">
                            <span className="text-sm text-destructive font-medium">Failed to load QR Code</span>
                            <p className="text-xs text-muted-foreground mt-1">Please try again later.</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.location.reload()}
                                className="mt-2"
                            >
                                <RefreshCcw className="w-3 h-3 mr-2" /> Retry
                            </Button>
                        </div>
                    ) : (
                        <div className="text-center">
                            <QrCode className="mx-auto h-12 w-12 opacity-20" />
                            <p className="mt-2 text-sm text-muted-foreground">Waiting for QR Code...</p>
                        </div>
                    )}
                </div>
            )}

            {qrData?.qrCode && (
                <p className="text-xs text-muted-foreground text-center">
                    This code refreshes automatically every 20 seconds.
                </p>
            )}
        </div>
    );
}

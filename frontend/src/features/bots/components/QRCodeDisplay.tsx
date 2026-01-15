'use client';

import { QrCode } from 'lucide-react';
import { useBotQR } from '@/features/bots/hooks';

interface QRCodeDisplayProps {
    botId: string;
}

export function QRCodeDisplay({ botId }: QRCodeDisplayProps) {
    const { data: qrData, isFetching: isQRLoading, error } = useBotQR(botId);

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

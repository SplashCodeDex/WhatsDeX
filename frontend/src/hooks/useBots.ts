import { useState, useCallback } from 'react';
import { botService } from '@/services/botService';
import { toast } from '@/hooks/use-toast';
import { Bot, Template } from '@/types';

export function useBots(tenantId?: string) {
    const [bots, setBots] = useState<Bot[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchBots = useCallback(async () => {
        if (!tenantId) return;
        setLoading(true);
        setError(null);
        try {
            const response = await botService.getBots(tenantId);
            const botList = Array.isArray(response) ? response : (response.data || []);
            setBots(botList);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to fetch bots';
            setError(message);
            toast({
                title: 'Error',
                description: 'Failed to load bots',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [tenantId]);

    const fetchTemplates = useCallback(async () => {
        setLoading(true);
        try {
            const response = await botService.getTemplates();
            const list = response.data || response;
            setTemplates(list);
        } catch (err: unknown) {
            console.error(err);
            toast({ title: 'Error', description: 'Failed to load templates', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, []);

    const createBot = async (data: any) => {
        if (!tenantId) return;
        try {
            const response = await botService.createBot(tenantId, data);
            if (response.success) {
                toast({ title: 'Success', description: 'Bot created successfully' });
                fetchBots();
                return response;
            } else {
                throw new Error(response.error || 'Failed to create bot');
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            toast({ title: 'Error', description: message, variant: 'destructive' });
            throw err;
        }
    };

    const startBot = async (botId: string) => {
        try {
            const response = await botService.startBot(botId);
            if (response.success) {
                toast({ title: 'Success', description: 'Bot started' });
                fetchBots();
            }
            return response;
        } catch (err: unknown) {
            toast({ title: 'Error', description: 'Failed to start bot', variant: 'destructive' });
        }
    };

    const stopBot = async (botId: string) => {
        try {
            const response = await botService.stopBot(botId);
            if (response.success) {
                toast({ title: 'Success', description: 'Bot stopped' });
                fetchBots();
            }
            return response;
        } catch (err: unknown) {
            toast({ title: 'Error', description: 'Failed to stop bot', variant: 'destructive' });
        }
    };

    const getQrCode = async (botId: string) => {
        try {
            return await botService.getBotQRCode(botId);
        } catch (err: unknown) {
            toast({ title: 'Error', description: 'Failed to get QR code', variant: 'destructive' });
            return null;
        }
    };

    const getBotStatus = async (botId: string) => {
        try {
            return await botService.getBotStatus(botId);
        } catch (err: unknown) {
            console.error(err);
            const message = err instanceof Error ? err.message : 'Unknown error';
            return { status: 'error', error: message };
        }
    };

    const applyTemplate = async (botId: string, templateId: string) => {
        setLoading(true);
        try {
            await botService.applyTemplate(botId, templateId);
            toast({ title: 'Success', description: 'Template applied' });
        } catch (err: unknown) {
            console.error(err);
            const message = err instanceof Error ? err.message : 'Failed to apply template';
            toast({ title: 'Error', description: message, variant: 'destructive' });
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        bots,
        loading,
        error,
        fetchBots,
        createBot,
        startBot,
        stopBot,
        getQrCode,
        getBotStatus,
        applyTemplate,
        fetchTemplates,
        templates
    };
}

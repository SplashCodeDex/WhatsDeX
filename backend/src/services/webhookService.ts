import axios from 'axios';
import crypto from 'crypto';
import { firebaseService } from './FirebaseService.js';
import { Webhook, WebhookSchema, WebhookEvent, Result } from '../types/contracts.js';
import { Timestamp } from 'firebase-admin/firestore';
import logger from '../utils/logger.js';

import { tenantConfigService } from './tenantConfigService.js';
import { OpenClawGateway } from './openClawGateway.js';

export class WebhookService {
    /**
     * Create a new webhook for a tenant
     */
    async createWebhook(tenantId: string, data: Partial<Webhook>, metadata: { actor: string; ip?: string } = { actor: 'system' }): Promise<Result<Webhook>> {
        try {
            const webhookId = `wh_${Date.now()}`;
            const secret = crypto.randomBytes(32).toString('hex');

            const rawWebhook = {
                id: webhookId,
                url: data.url,
                events: data.events || [],
                secret: secret,
                isActive: true,
                name: data.name || 'External API Hook',
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                ...data
            };

            const webhook = WebhookSchema.parse(rawWebhook);
            await firebaseService.setDoc<'tenants/{tenantId}/webhooks'>('webhooks', webhookId, webhook as any, tenantId);

            // FUSION: Sync with OpenClaw engine
            try {
                const gateway = OpenClawGateway.getInstance();
                if (gateway.isInitialized()) {
                    const liveConfig = await gateway.getLiveConfig();
                    const currentHooks = liveConfig.hooks?.mappings || [];
                    
                    await gateway.patchConfig(tenantId, {
                        hooks: {
                            mappings: [...currentHooks, {
                                id: webhook.id,
                                name: webhook.name,
                                url: webhook.url,
                                events: webhook.events,
                                isActive: webhook.isActive
                            }]
                        }
                    }, metadata);
                }
            } catch (fusionError) {
                logger.error(`[WebhookService] Engine sync failed for ${webhookId}:`, fusionError);
            }

            return { success: true, data: webhook };
        } catch (error: unknown) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error(`WebhookService.createWebhook error [${tenantId}]:`, err);
            return { success: false, error: err };
        }
    }

    /**
     * Get all webhooks for a tenant
     */
    async getWebhooks(tenantId: string): Promise<Result<Webhook[]>> {
        try {
            const webhooks = await firebaseService.getCollection<'tenants/{tenantId}/webhooks'>('webhooks', tenantId);
            return { success: true, data: webhooks as Webhook[] };
        } catch (error: unknown) {
            const err = error instanceof Error ? error : new Error(String(error));
            return { success: false, error: err };
        }
    }

    /**
     * Dispatch an event to all relevant webhooks for a tenant
     */
    async dispatch(tenantId: string, event: WebhookEvent, payload: any): Promise<void> {
        try {
            // Feature Flag Check
            const isEnabled = await tenantConfigService.isFeatureEnabled(tenantId, 'webhooksEnabled');
            if (!isEnabled) return;

            const webhooksResult = await this.getWebhooks(tenantId);
            if (!webhooksResult.success) return;

            const activeHooks = webhooksResult.data.filter(h => h.isActive && h.events.includes(event));

            for (const hook of activeHooks) {
                this.sendWebhook(hook, event, payload).catch(err => {
                    logger.error(`Webhook dispatch failed for ${hook.url}:`, err);
                });
            }
        } catch (error) {
            logger.error(`WebhookService.dispatch error [${tenantId}]:`, error);
        }
    }

    /**
     * Internal method to send the HTTP POST request with signature
     */
    private async sendWebhook(hook: Webhook, event: WebhookEvent, payload: any): Promise<void> {
        const timestamp = Date.now();
        // 2026 Security Fix: Use actual tenant context from payload if available, or hook.tenantId
        const tenantId = payload.tenantId || (hook.name || '').split('_')[0]; // Fallback logic or update schema

        const body = JSON.stringify({
            event,
            timestamp,
            tenantId: tenantId,
            data: payload
        });

        // HMAC SHA256 Signing for security
        const signature = crypto
            .createHmac('sha256', hook.secret)
            .update(body)
            .digest('hex');

        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            try {
                await axios.post(hook.url, body, {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-DeXMart-Signature': signature,
                        'X-DeXMart-Timestamp': timestamp.toString(),
                        'User-Agent': 'DeXMart-Webhook-Engine/1.0'
                    },
                    timeout: 5000
                });
                logger.debug(`Webhook delivered: ${event} -> ${hook.url}`);
                return;
            } catch (error) {
                attempts++;
                if (attempts >= maxAttempts) {
                    logger.warn(`Webhook failed after ${maxAttempts} attempts: ${hook.url}`);
                } else {
                    // Exponential backoff
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
                }
            }
        }
    }

    /**
     * Delete a webhook
     */
    async deleteWebhook(tenantId: string, webhookId: string, metadata: { actor: string; ip?: string } = { actor: 'system' }): Promise<Result<void>> {
        try {
            await firebaseService.deleteDoc<'tenants/{tenantId}/webhooks'>('webhooks', webhookId, tenantId);

            // FUSION: Sync with OpenClaw engine
            try {
                const gateway = OpenClawGateway.getInstance();
                if (gateway.isInitialized()) {
                    const liveConfig = await gateway.getLiveConfig();
                    const filteredHooks = (liveConfig.hooks?.mappings || []).filter((h: any) => h.id !== webhookId);
                    
                    await gateway.patchConfig(tenantId, {
                        hooks: {
                            mappings: filteredHooks
                        }
                    }, metadata);
                }
            } catch (fusionError) {
                logger.error(`[WebhookService] Engine removal failed for ${webhookId}:`, fusionError);
            }

            return { success: true, data: undefined };
        } catch (error: unknown) {
            return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
        }
    }
}

export const webhookService = new WebhookService();
export default webhookService;

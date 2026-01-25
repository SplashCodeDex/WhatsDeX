/**
 * Tenant Configuration Service
 *
 * Manages tenant-specific settings stored in Firestore.
 * This is the proper place for user-configurable settings,
 * NOT environment variables.
 *
 * Configuration Hierarchy:
 * 1. Infrastructure (.env) - Platform operator only
 * 2. Platform Defaults (code) - Fallback values
 * 3. Tenant Settings (Firestore) - Customer controlled
 * 4. Bot Settings (Firestore) - Per-bot overrides
 */

import { db } from '../lib/firebase.js';
import logger from '../utils/logger.js';
import {
    TenantSettings,
    TenantSettingsSchema,
    BotConfig,
    BotConfigSchema,
    DEFAULT_TENANT_SETTINGS,
    DEFAULT_BOT_CONFIG,
} from '../types/tenantConfig.js';
import type { Result } from '../types/contracts.js';

// =============================================================================
// TenantConfigService
// =============================================================================

export class TenantConfigService {
    private static instance: TenantConfigService;

    // In-memory cache for frequently accessed settings
    private settingsCache: Map<string, { data: TenantSettings; expiry: number }> = new Map();
    private botConfigCache: Map<string, { data: BotConfig; expiry: number }> = new Map();
    private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

    private constructor() { }

    public static getInstance(): TenantConfigService {
        if (!TenantConfigService.instance) {
            TenantConfigService.instance = new TenantConfigService();
        }
        return TenantConfigService.instance;
    }

    // ===========================================================================
    // Tenant Settings
    // ===========================================================================

    /**
     * Get tenant settings from Firestore with caching.
     * Falls back to defaults if not found.
     */
    async getTenantSettings(tenantId: string): Promise<Result<TenantSettings>> {
        try {
            // Check cache first
            const cached = this.settingsCache.get(tenantId);
            if (cached && Date.now() < cached.expiry) {
                return { success: true, data: cached.data };
            }

            // Fetch from Firestore
            const docRef = db.collection('tenants').doc(tenantId).collection('settings').doc('general');
            const doc = await docRef.get();

            let settings: TenantSettings;
            if (doc.exists) {
                // Validate and parse
                const rawData = doc.data();
                settings = TenantSettingsSchema.parse({
                    ...DEFAULT_TENANT_SETTINGS,
                    ...rawData,
                });
            } else {
                // Return defaults for new tenant
                settings = TenantSettingsSchema.parse(DEFAULT_TENANT_SETTINGS);
            }

            // Update cache
            this.settingsCache.set(tenantId, {
                data: settings,
                expiry: Date.now() + this.CACHE_TTL_MS,
            });

            return { success: true, data: settings };
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error(`[TenantConfigService] Failed to get tenant settings for ${tenantId}:`, err);
            return { success: false, error: err };
        }
    }

    /**
     * Update tenant settings in Firestore.
     */
    async updateTenantSettings(
        tenantId: string,
        updates: Partial<TenantSettings>
    ): Promise<Result<TenantSettings>> {
        try {
            const docRef = db.collection('tenants').doc(tenantId).collection('settings').doc('general');

            // Get current settings
            const currentResult = await this.getTenantSettings(tenantId);
            if (!currentResult.success) {
                return currentResult;
            }

            // Merge and validate
            const merged = TenantSettingsSchema.parse({
                ...currentResult.data,
                ...updates,
                updatedAt: new Date(),
            });

            // Save to Firestore
            await docRef.set(merged, { merge: true });

            // Invalidate cache
            this.settingsCache.delete(tenantId);

            logger.info(`[TenantConfigService] Updated settings for tenant ${tenantId}`);
            return { success: true, data: merged };
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error(`[TenantConfigService] Failed to update tenant settings:`, err);
            return { success: false, error: err };
        }
    }

    /**
     * Initialize default settings for a new tenant.
     */
    async initializeTenantSettings(
        tenantId: string,
        ownerNumber: string
    ): Promise<Result<TenantSettings>> {
        try {
            const settings = TenantSettingsSchema.parse({
                ...DEFAULT_TENANT_SETTINGS,
                ownerNumber,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const docRef = db.collection('tenants').doc(tenantId).collection('settings').doc('general');
            await docRef.set(settings);

            logger.info(`[TenantConfigService] Initialized settings for new tenant ${tenantId}`);
            return { success: true, data: settings };
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error(`[TenantConfigService] Failed to initialize tenant settings:`, err);
            return { success: false, error: err };
        }
    }

    // ===========================================================================
    // Bot Configuration
    // ===========================================================================

    /**
     * Get bot configuration from Firestore.
     */
    async getBotConfig(tenantId: string, botId: string): Promise<Result<BotConfig>> {
        try {
            const cacheKey = `${tenantId}:${botId}`;

            // Check cache
            const cached = this.botConfigCache.get(cacheKey);
            if (cached && Date.now() < cached.expiry) {
                return { success: true, data: cached.data };
            }

            // Fetch from Firestore
            const docRef = db.collection('tenants').doc(tenantId).collection('bots').doc(botId);
            const doc = await docRef.get();

            let config: BotConfig;
            if (doc.exists) {
                const rawData = doc.data();
                config = BotConfigSchema.parse({
                    ...DEFAULT_BOT_CONFIG,
                    ...rawData,
                });
            } else {
                // Return defaults
                config = BotConfigSchema.parse(DEFAULT_BOT_CONFIG);
            }

            // Update cache
            this.botConfigCache.set(cacheKey, {
                data: config,
                expiry: Date.now() + this.CACHE_TTL_MS,
            });

            return { success: true, data: config };
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error(`[TenantConfigService] Failed to get bot config:`, err);
            return { success: false, error: err };
        }
    }

    /**
     * Update bot configuration.
     */
    async updateBotConfig(
        tenantId: string,
        botId: string,
        updates: Partial<BotConfig>
    ): Promise<Result<BotConfig>> {
        try {
            const docRef = db.collection('tenants').doc(tenantId).collection('bots').doc(botId);

            // Get current config
            const currentResult = await this.getBotConfig(tenantId, botId);
            if (!currentResult.success) {
                return currentResult;
            }

            // Merge and validate
            const merged = BotConfigSchema.parse({
                ...currentResult.data,
                ...updates,
                updatedAt: new Date(),
            });

            // Save to Firestore
            await docRef.set(merged, { merge: true });

            // Invalidate cache
            this.botConfigCache.delete(`${tenantId}:${botId}`);

            logger.info(`[TenantConfigService] Updated config for bot ${botId}`);
            return { success: true, data: merged };
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error(`[TenantConfigService] Failed to update bot config:`, err);
            return { success: false, error: err };
        }
    }

    // ===========================================================================
    // Helper Methods
    // ===========================================================================

    /**
     * Get the owner number for a tenant (from Firestore, not env).
     */
    async getOwnerNumber(tenantId: string): Promise<string | null> {
        const result = await this.getTenantSettings(tenantId);
        if (result.success) {
            return result.data.ownerNumber ?? null;
        }
        return null;
    }

    /**
   * Check if a feature is enabled for a tenant.
   * Only checks boolean features (not maxBots which is a number).
   */
    async isFeatureEnabled(
        tenantId: string,
        feature: 'aiEnabled' | 'campaignsEnabled' | 'analyticsEnabled' | 'webhooksEnabled'
    ): Promise<boolean> {
        const result = await this.getTenantSettings(tenantId);
        if (result.success && result.data.features) {
            return result.data.features[feature] ?? false;
        }
        return false;
    }

    /**
     * Clear all caches (useful for testing).
     */
    clearCache(): void {
        this.settingsCache.clear();
        this.botConfigCache.clear();
    }
}

// Export singleton instance
export const tenantConfigService = TenantConfigService.getInstance();
export default tenantConfigService;

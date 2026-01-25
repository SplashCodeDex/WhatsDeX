/**
 * Universal API Key Rotation Manager
 * Implements: Circuit Breaker, Key Rotation, Persistence, Exponential Backoff
 *
 * @fileoverview Manages a pool of API keys for Google Gemini with automatic
 * rotation on rate limits, circuit breaker protection, and state persistence.
 *
 * @module lib/apiKeyManager
 */

import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import logger from '../utils/logger.js';
import type { Result } from '../types/contracts.js';

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
    MAX_CONSECUTIVE_FAILURES: 5,
    COOLDOWN_TRANSIENT_MS: 60 * 1000,      // 1 minute for 500/503 errors
    COOLDOWN_QUOTA_MS: 5 * 60 * 1000,      // 5 minutes for 429 errors
    HALF_OPEN_TEST_DELAY_MS: 60 * 1000,    // 1 minute before testing OPEN circuit
    STATE_FILE: join(tmpdir(), 'whatsdex_api_key_state.json'),
} as const;

// ============================================================================
// Zod Schemas
// ============================================================================

/**
 * Schema for parsing the API keys environment variable.
 * Accepts either a JSON array string or a single key string.
 */
const ApiKeysEnvSchema = z.string().min(1).transform((val): string[] => {
    const trimmed = val.trim();
    if (trimmed.startsWith('[')) {
        try {
            const parsed = JSON.parse(trimmed);
            return z.array(z.string().min(1)).parse(parsed);
        } catch {
            throw new Error('Invalid JSON array format for API keys');
        }
    }
    // Single key -> array of one
    return [trimmed];
});

/**
 * Schema for persisted key state
 */
const PersistedKeyStateSchema = z.object({
    failCount: z.number().default(0),
    circuitState: z.enum(['CLOSED', 'OPEN', 'HALF_OPEN']).default('CLOSED'),
    lastUsed: z.number().default(0),
    failedAt: z.number().nullable().default(null),
    isQuotaError: z.boolean().default(false),
    halfOpenTestTime: z.number().nullable().default(null),
    successCount: z.number().default(0),
    totalRequests: z.number().default(0),
});

const PersistedStateSchema = z.record(z.string(), PersistedKeyStateSchema);

// ============================================================================
// Types
// ============================================================================

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface KeyState {
    readonly key: string;
    failCount: number;
    failedAt: number | null;
    isQuotaError: boolean;
    circuitState: CircuitState;
    lastUsed: number;
    successCount: number;
    totalRequests: number;
    halfOpenTestTime: number | null;
}

interface ApiKeyManagerStats {
    readonly totalKeys: number;
    readonly healthyKeys: number;
    readonly openCircuits: number;
    readonly halfOpenCircuits: number;
    readonly totalRequests: number;
    readonly totalSuccesses: number;
}

// ============================================================================
// ApiKeyManager Class
// ============================================================================

/**
 * Manages a pool of API keys with circuit breaker pattern and automatic rotation.
 *
 * @example
 * ```typescript
 * const manager = ApiKeyManager.getInstance();
 * const keyResult = manager.getKey();
 * if (keyResult.success) {
 *   try {
 *     await callApi(keyResult.data);
 *     manager.markSuccess(keyResult.data);
 *   } catch (error) {
 *     manager.markFailed(keyResult.data, isQuotaError(error));
 *   }
 * }
 * ```
 */
export class ApiKeyManager {
    private static instance: ApiKeyManager | null = null;
    private readonly keys: KeyState[];
    private readonly stateFilePath: string;

    private constructor(apiKeys: readonly string[]) {
        this.stateFilePath = CONFIG.STATE_FILE;
        this.keys = apiKeys.map((key) => this.createKeyState(key));

        if (apiKeys.length > 0) {
            this.loadState();
            logger.info(`[ApiKeyManager] Initialized with ${this.keys.length} keys`);
        }
    }

    /**
     * Get or create the singleton instance of ApiKeyManager.
     * Reads API keys from GOOGLE_GEMINI_API_KEY environment variable.
     */
    public static getInstance(): Result<ApiKeyManager> {
        if (ApiKeyManager.instance) {
            return { success: true, data: ApiKeyManager.instance };
        }

        const envValue = process.env.GOOGLE_GEMINI_API_KEY;
        if (!envValue) {
            logger.warn('[ApiKeyManager] GOOGLE_GEMINI_API_KEY is not set. AI features will be disabled.');
            // Create a disabled instance
            ApiKeyManager.instance = new ApiKeyManager([]);
            return { success: true, data: ApiKeyManager.instance };
        }

        try {
            const keys = ApiKeysEnvSchema.parse(envValue);
            if (keys.length === 0) {
                logger.warn('[ApiKeyManager] GOOGLE_GEMINI_API_KEY is empty. AI features will be disabled.');
                // Create a disabled instance
                ApiKeyManager.instance = new ApiKeyManager([]);
                return { success: true, data: ApiKeyManager.instance };
            }

            ApiKeyManager.instance = new ApiKeyManager(keys);
            return { success: true, data: ApiKeyManager.instance };
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error('[ApiKeyManager] Failed to parse API keys:', err);
            return { success: false, error: err };
        }
    }

    /**
     * Reset the singleton instance (useful for testing).
     */
    public static resetInstance(): void {
        ApiKeyManager.instance = null;
    }

    /**
     * Get the best available API key using priority algorithm:
     * 1. Filter out OPEN circuits and cooling down keys
     * 2. Prioritize pristine keys (0 failures)
     * 3. Then fewest failures
     * 4. Then least recently used (LRU)
     */
    public getKey(): Result<string> {
        const now = Date.now();

        // Update circuit states (OPEN -> HALF_OPEN if cooldown expired)
        this.updateCircuitStates(now);

        // Filter healthy candidates
        const candidates = this.keys.filter((k) => !this.isOnCooldown(k, now));

        if (candidates.length === 0) {
            // Fallback: Return oldest failed key (desperation mode)
            const fallback = this.keys
                .slice()
                .sort((a, b) => (a.failedAt ?? 0) - (b.failedAt ?? 0))[0];

            if (fallback) {
                logger.warn(`[ApiKeyManager] All keys exhausted, using fallback key ...${this.maskKey(fallback.key)}`);
                fallback.lastUsed = now;
                fallback.totalRequests++;
                this.saveState();
                return { success: true, data: fallback.key };
            }

            return {
                success: false,
                error: new Error('No API keys available'),
            };
        }

        // Sort candidates by priority
        candidates.sort((a, b) => {
            // Priority A: Pristine keys first
            if (a.failCount !== b.failCount) {
                return a.failCount - b.failCount;
            }
            // Priority B: Least recently used
            return a.lastUsed - b.lastUsed;
        });

        const selected = candidates[0];
        selected.lastUsed = now;
        selected.totalRequests++;
        this.saveState();

        logger.debug(`[ApiKeyManager] Selected key ...${this.maskKey(selected.key)} (failures: ${selected.failCount}, circuit: ${selected.circuitState})`);

        return { success: true, data: selected.key };
    }

    /**
     * Get a GoogleGenerativeAI client with the current best key.
     */
    public getClient(): Result<GoogleGenerativeAI> {
        const keyResult = this.getKey();
        if (!keyResult.success) {
            return keyResult;
        }
        return { success: true, data: new GoogleGenerativeAI(keyResult.data) };
    }

    /**
     * Get the total number of keys in the pool.
     */
    public getKeyCount(): number {
        return this.keys.length;
    }

    /**
     * Get statistics about the key pool.
     */
    public getStats(): ApiKeyManagerStats {
        const now = Date.now();
        this.updateCircuitStates(now);

        return {
            totalKeys: this.keys.length,
            healthyKeys: this.keys.filter((k) => k.circuitState === 'CLOSED').length,
            openCircuits: this.keys.filter((k) => k.circuitState === 'OPEN').length,
            halfOpenCircuits: this.keys.filter((k) => k.circuitState === 'HALF_OPEN').length,
            totalRequests: this.keys.reduce((sum, k) => sum + k.totalRequests, 0),
            totalSuccesses: this.keys.reduce((sum, k) => sum + k.successCount, 0),
        };
    }

    /**
     * Mark a key as successful. Resets circuit to CLOSED.
     */
    public markSuccess(key: string): void {
        const keyState = this.keys.find((k) => k.key === key);
        if (!keyState) {
            logger.warn(`[ApiKeyManager] markSuccess called with unknown key`);
            return;
        }

        if (keyState.circuitState !== 'CLOSED') {
            logger.info(`[ApiKeyManager] Key ...${this.maskKey(key)} recovered (${keyState.circuitState} -> CLOSED)`);
        }

        keyState.circuitState = 'CLOSED';
        keyState.failCount = 0;
        keyState.failedAt = null;
        keyState.isQuotaError = false;
        keyState.halfOpenTestTime = null;
        keyState.successCount++;

        this.saveState();
    }

    /**
     * Mark a key as failed. Opens circuit based on failure type.
     *
     * @param key - The API key that failed
     * @param isQuota - True if this was a 429 quota error (longer cooldown)
     */
    public markFailed(key: string, isQuota: boolean = false): void {
        const keyState = this.keys.find((k) => k.key === key);
        if (!keyState) {
            logger.warn(`[ApiKeyManager] markFailed called with unknown key`);
            return;
        }

        const now = Date.now();
        keyState.failedAt = now;
        keyState.failCount++;
        keyState.isQuotaError = isQuota;

        // State transitions
        if (keyState.circuitState === 'HALF_OPEN') {
            // Test failed, go back to OPEN immediately
            keyState.circuitState = 'OPEN';
            keyState.halfOpenTestTime = now + CONFIG.HALF_OPEN_TEST_DELAY_MS;
            logger.warn(`[ApiKeyManager] Key ...${this.maskKey(key)} HALF_OPEN test failed, reopening circuit`);
        } else if (keyState.failCount >= CONFIG.MAX_CONSECUTIVE_FAILURES || isQuota) {
            // Exhausted or hard quota -> OPEN
            keyState.circuitState = 'OPEN';
            const cooldown = isQuota ? CONFIG.COOLDOWN_QUOTA_MS : CONFIG.HALF_OPEN_TEST_DELAY_MS;
            keyState.halfOpenTestTime = now + cooldown;

            logger.warn(
                `[ApiKeyManager] Key ...${this.maskKey(key)} circuit OPEN (${isQuota ? '429 quota' : `${keyState.failCount} failures`}), cooldown: ${cooldown / 1000}s`
            );
        }

        this.saveState();
    }

    // ==========================================================================
    // Private Methods
    // ==========================================================================

    private createKeyState(key: string): KeyState {
        return {
            key,
            failCount: 0,
            failedAt: null,
            isQuotaError: false,
            circuitState: 'CLOSED',
            lastUsed: 0,
            successCount: 0,
            totalRequests: 0,
            halfOpenTestTime: null,
        };
    }

    private maskKey(key: string): string {
        return key.slice(-4);
    }

    private isOnCooldown(keyState: KeyState, now: number): boolean {
        if (keyState.circuitState === 'OPEN') {
            // Check if ready for HALF_OPEN test
            if (keyState.halfOpenTestTime && now >= keyState.halfOpenTestTime) {
                return false; // Will transition to HALF_OPEN in updateCircuitStates
            }
            return true; // Still blocked
        }

        // Additional safeguard for rapid errors before circuit opens
        if (keyState.failedAt && keyState.circuitState === 'CLOSED') {
            const cooldown = keyState.isQuotaError
                ? CONFIG.COOLDOWN_QUOTA_MS
                : CONFIG.COOLDOWN_TRANSIENT_MS;
            if (now - keyState.failedAt < cooldown && keyState.failCount > 0) {
                return true;
            }
        }

        return false;
    }

    private updateCircuitStates(now: number): void {
        for (const keyState of this.keys) {
            if (keyState.circuitState === 'OPEN') {
                if (keyState.halfOpenTestTime && now >= keyState.halfOpenTestTime) {
                    keyState.circuitState = 'HALF_OPEN';
                    logger.info(`[ApiKeyManager] Key ...${this.maskKey(keyState.key)} circuit HALF_OPEN (ready for test)`);
                }
            }
        }
    }

    private saveState(): void {
        try {
            const state: Record<string, z.infer<typeof PersistedKeyStateSchema>> = {};
            for (const k of this.keys) {
                state[k.key] = {
                    failCount: k.failCount,
                    circuitState: k.circuitState,
                    lastUsed: k.lastUsed,
                    failedAt: k.failedAt,
                    isQuotaError: k.isQuotaError,
                    halfOpenTestTime: k.halfOpenTestTime,
                    successCount: k.successCount,
                    totalRequests: k.totalRequests,
                };
            }
            writeFileSync(this.stateFilePath, JSON.stringify(state, null, 2), 'utf-8');
            logger.debug(`[ApiKeyManager] State saved to ${this.stateFilePath}`);
        } catch (error) {
            logger.warn('[ApiKeyManager] Failed to save state:', error);
        }
    }

    private loadState(): void {
        try {
            if (!existsSync(this.stateFilePath)) {
                logger.debug('[ApiKeyManager] No persisted state found, starting fresh');
                return;
            }

            const raw = readFileSync(this.stateFilePath, 'utf-8');
            const parsed = PersistedStateSchema.parse(JSON.parse(raw));

            for (const keyState of this.keys) {
                const persisted = parsed[keyState.key];
                if (persisted) {
                    Object.assign(keyState, persisted);
                }
            }

            logger.info(`[ApiKeyManager] Loaded persisted state for ${Object.keys(parsed).length} keys`);
        } catch (error) {
            logger.warn('[ApiKeyManager] Failed to load persisted state:', error);
        }
    }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Detect if an error is a quota/rate limit error (429).
 */
export function isQuotaError(error: unknown): boolean {
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        return (
            message.includes('429') ||
            message.includes('quota') ||
            message.includes('rate limit') ||
            message.includes('resource exhausted') ||
            message.includes('too many requests') ||
            // Treat expired/invalid keys as strictly as quota errors (immediate circuit open)
            message.includes('expired') ||
            message.includes('invalid') ||
            message.includes('400 bad request') ||
            message.includes('api_key_invalid')
        );
    }
    return false;
}

/**
 * Detect if an error is a transient server error (500, 503).
 */
export function isTransientError(error: unknown): boolean {
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        return (
            message.includes('500') ||
            message.includes('503') ||
            message.includes('internal server error') ||
            message.includes('service unavailable') ||
            message.includes('timeout')
        );
    }
    return false;
}

// Default export for convenience
export default ApiKeyManager;

/**
 * ApiKeyManager - Handles multiple API keys with automatic rotation and failover.
 *
 * Features:
 * - Round-robin / Least Recently Used (LRU) key selection for load balancing
 * - Automatic retry with next key on failure (429/403/400)
 * - Exponential backoff with jitter for rate limiting
 * - Circuit breaker-like cooldown for failed keys
 * - Tracks failed keys to avoid reusing them immediately
 *
 * Configuration:
 * - Set `VITE_GEMINI_API_KEYS` as a JSON array string: `["key1", "key2", "key3"]`
 * - Keys from DIFFERENT Google Cloud projects get separate quotas
 * - Keys from the SAME project share the same quota
 */

import { logger } from "@/utils/logger";

// Circuit Breaker States
type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

// Store keys and their state
interface KeyState {
    key: string;
    lastUsed: number;                // Timestamp of last use (for LRU)
    failedAt: number | null;         // Timestamp of last failure
    failCount: number;               // Consecutive failure count
    successCount: number;            // Total successes (for health scoring)
    totalRequests: number;           // Total requests made
    retryAfter: number | null;       // Server-specified retry timestamp
    lastBackoffDelay: number;        // Last backoff delay used (for exponential growth)
    isQuotaError: boolean;           // True if last failure was quota (429)
    circuitState: CircuitBreakerState; // Circuit breaker state
    halfOpenTestTime: number | null; // When to allow test request in half-open
}

// Backoff configuration
const BACKOFF_CONFIG = {
    BASE_DELAY_MS: 1000,             // 1 second base
    MAX_DELAY_MS: 60000,             // 60 seconds max
    MAX_JITTER_MS: 1000,             // 0-1000ms random jitter
    TRANSIENT_COOLDOWN_MS: 60000,    // 1 minute cooldown for transient errors
    QUOTA_COOLDOWN_MS: 300000,       // 5 minutes cooldown for quota errors (429)
    MAX_CONSECUTIVE_FAILURES: 5,     // After this, key is "exhausted"
    HALF_OPEN_TEST_INTERVAL_MS: 60000, // 1 min to allow test request after OPEN
} as const;

export class ApiKeyManager {
    private keys: KeyState[] = [];

    private readonly STORAGE_KEY = 'gemini_api_key_states';

    constructor(initialKeys?: string[]) {
        if (initialKeys && initialKeys.length > 0) {
            this.keys = initialKeys.map(key => this.createKeyState(key));
            logger.info(`[ApiKeyManager] Loaded ${this.keys.length} keys from memory.`);
        } else {
            this.loadKeys();
        }
        this.loadState();

        // Setup cross-tab synchronization
        if (typeof window !== 'undefined') {
            window.addEventListener('storage', (event) => {
                if (event.key === this.STORAGE_KEY) {
                    this.loadState();
                }
            });
        }

        logger.info(`[ApiKeyManager] Initialized with ${this.keys.length} keys.`);
    }

    private loadKeys(): void {
        // 1. Check for Test Keys in LocalStorage (Priority for E2E tests)
        if (typeof window !== 'undefined' && window.localStorage) {
            const testKey = localStorage.getItem("TACTMS_TEST_API_KEYS");
            if (testKey) {
                this.keys = [this.createKeyState(testKey)];
                return;
            }
        }

        // 2. Try loading from env var (JSON array or comma-separated)
        const keysJson = import.meta.env.VITE_GEMINI_API_KEYS;
        if (keysJson) {
            try {
                const parsed = JSON.parse(keysJson);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    this.keys = parsed.map((key: string) => this.createKeyState(key.trim()));
                    logger.info(`[ApiKeyManager] Loaded ${this.keys.length} API keys for rotation.`);
                    return;
                }
            } catch {
                // Maybe it's a comma-separated list, not JSON
                const commaSeparated = keysJson.split(',').map((k: string) => k.trim()).filter(Boolean);
                if (commaSeparated.length > 0) {
                    this.keys = commaSeparated.map((key: string) => this.createKeyState(key));
                    logger.info(`[ApiKeyManager] Loaded ${this.keys.length} API keys (comma-separated).`);
                    return;
                }
            }
        }

        // 3. Fallback to single key for backwards compatibility
        const singleKey = import.meta.env.VITE_GEMINI_API_KEYS;
        if (singleKey && typeof singleKey === 'string' && !singleKey.startsWith('[')) {
            this.keys = [this.createKeyState(singleKey.trim())];
        } else if (this.keys.length === 0) {
            logger.warn('[ApiKeyManager] No API keys configured!');
        }
    }

    private createKeyState(key: string): KeyState {
        return {
            key,
            lastUsed: 0,
            failedAt: null,
            failCount: 0,
            successCount: 0,
            totalRequests: 0,
            retryAfter: null,
            lastBackoffDelay: 0,
            isQuotaError: false,
            circuitState: 'CLOSED',
            halfOpenTestTime: null,
        };
    }

    /**
     * Persist key states to localStorage.
     * We don't save the keys themselves (security/env source), just their health state.
     */
    private saveState(): void {
        try {
            if (typeof localStorage === 'undefined') return;

            const stateToSave = this.keys.reduce((acc, k) => {
                // Save state if used or has history
                if (k.lastUsed > 0 || k.failCount > 0 || k.failedAt !== null || k.circuitState !== 'CLOSED' || k.successCount > 0) {
                    acc[k.key] = {
                        lastUsed: k.lastUsed,
                        failedAt: k.failedAt,
                        failCount: k.failCount,
                        successCount: k.successCount,
                        totalRequests: k.totalRequests,
                        retryAfter: k.retryAfter,
                        isQuotaError: k.isQuotaError,
                        circuitState: k.circuitState,
                        halfOpenTestTime: k.halfOpenTestTime
                    };
                }
                return acc;
            }, {} as Record<string, Partial<KeyState>>);

            // READ-MODIFY-WRITE for atomic-like consistency
            // We read the latest state from storage to merge with our updates
            // preventing overwrites if another tab updated a different key.
            const existingRaw = localStorage.getItem(this.STORAGE_KEY);
            const finalState = stateToSave;

            if (existingRaw) {
                try {
                    const existingState = JSON.parse(existingRaw) as Record<string, Partial<KeyState>>;

                    // Merge existing state into our state-to-save (priority to "worse" health)
                    // If storage says failed, and we say healthy (which shouldn't happen if we sync), keep failure.
                    // If storage says healthy, and we say failed, we overwrite with failure.
                    // Basically, we want to accumulate failures and cooldowns.

                    Object.keys(existingState).forEach(key => {
                        const remote = existingState[key];
                        const local = finalState[key];

                        if (!local) {
                            // We don't have updates for this key, keep remote state
                            finalState[key] = remote;
                        } else {
                            // Merge logic: preserve the most restrictive state

                            // Max failures
                            local.failCount = Math.max(local.failCount || 0, remote.failCount || 0);

                            // Max cooldowns / timestamps
                            local.failedAt = Math.max(local.failedAt || 0, remote.failedAt || 0) || (local.failedAt ?? remote.failedAt);
                            local.retryAfter = Math.max(local.retryAfter || 0, remote.retryAfter || 0) || (local.retryAfter ?? remote.retryAfter);

                            // Circuit breaker: OPEN trumps CLOSED
                            if (remote.circuitState === 'OPEN' && local.circuitState !== 'OPEN') {
                                local.circuitState = 'OPEN';
                            }

                            // Quota error: true trumps false
                            if (remote.isQuotaError && !local.isQuotaError) {
                                local.isQuotaError = true;
                            }
                        }
                    });
                } catch (e) {
                    console.warn('[ApiKeyManager] Failed to merge existing state, overwriting.', e);
                }
            }

            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(finalState));
        } catch (e) {
            console.error('[ApiKeyManager] Failed to save state to localStorage', e);
        }
    }

    /**
     * Load key states from localStorage.
     */
    private loadState(): void {
        try {
            if (typeof localStorage === 'undefined') return;

            const savedRaw = localStorage.getItem(this.STORAGE_KEY);
            if (!savedRaw) return;

            const savedState = JSON.parse(savedRaw) as Record<string, Partial<KeyState>>;
            let loadedCount = 0;

            this.keys.forEach(k => {
                const saved = savedState[k.key];
                if (saved) {
                    // Merge saved state into current key state
                    if (saved.lastUsed !== undefined) k.lastUsed = saved.lastUsed;
                    if (saved.failedAt !== undefined) k.failedAt = saved.failedAt;
                    if (saved.failCount !== undefined) k.failCount = saved.failCount;
                    if (saved.successCount !== undefined) k.successCount = saved.successCount;
                    if (saved.totalRequests !== undefined) k.totalRequests = saved.totalRequests;
                    if (saved.retryAfter !== undefined) k.retryAfter = saved.retryAfter;
                    if (saved.isQuotaError !== undefined) k.isQuotaError = saved.isQuotaError;
                    if (saved.circuitState !== undefined) k.circuitState = saved.circuitState as CircuitBreakerState;
                    if (saved.halfOpenTestTime !== undefined) k.halfOpenTestTime = saved.halfOpenTestTime;

                    if (k.failCount > 0 || k.lastUsed > 0) loadedCount++;
                }
            });

            if (loadedCount > 0) {
                logger.info(`[ApiKeyManager] Restored health state for ${loadedCount} keys from localStorage.`);
            }
        } catch (e) {
            console.error('[ApiKeyManager] Failed to load state from localStorage', e);
        }
    }

    /**
     * Calculate exponential backoff delay with jitter.
     * Formula: min(cap, base * 2^attempt) + random_jitter
     */
    public calculateBackoff(attempt: number): number {
        const { BASE_DELAY_MS, MAX_DELAY_MS, MAX_JITTER_MS } = BACKOFF_CONFIG;
        const exponentialDelay = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * Math.pow(2, attempt));
        const jitter = Math.random() * MAX_JITTER_MS;
        return Math.floor(exponentialDelay + jitter);
    }

    /**
     * Get the recommended backoff delay for a specific key.
     * Uses server's Retry-After if available, otherwise calculates from fail count.
     */
    public getBackoffDelay(key: string): number {
        const keyState = this.keys.find(k => k.key === key);
        if (!keyState) return this.calculateBackoff(0);

        // If server specified Retry-After, use that
        if (keyState.retryAfter !== null) {
            const waitTime = keyState.retryAfter - Date.now();
            if (waitTime > 0) return waitTime;
        }

        // Otherwise use exponential backoff based on fail count
        return this.calculateBackoff(keyState.failCount);
    }

    /**
     * Set the Retry-After delay from server response header.
     */
    public setRetryAfter(key: string, seconds: number): void {
        const keyState = this.keys.find(k => k.key === key);
        if (keyState) {
            keyState.retryAfter = Date.now() + (seconds * 1000);
            logger.info(`[ApiKeyManager] Key ...${key.slice(-4)} retry-after set to ${seconds}s`);
            this.saveState();
        }
    }

    /**
     * Check if a key is currently on cooldown (should not be used).
     * Uses circuit breaker pattern with quota-aware cooldowns.
     */
    private isOnCooldown(keyState: KeyState): boolean {
        const now = Date.now();

        // Circuit breaker OPEN state - key is blocked
        if (keyState.circuitState === 'OPEN') {
            // Check if we should transition to HALF_OPEN
            if (keyState.halfOpenTestTime !== null && now >= keyState.halfOpenTestTime) {
                keyState.circuitState = 'HALF_OPEN';
                logger.info(`[ApiKeyManager] Key ...${keyState.key.slice(-4)} circuit → HALF_OPEN (allowing test request)`);
                return false; // Allow one test request
            }
            return true; // Still blocked
        }

        // Check Retry-After first (server-specified)
        if (keyState.retryAfter !== null && now < keyState.retryAfter) {
            return true;
        }

        // Check failure cooldown (quota gets 5 min, transient gets 1 min)
        if (keyState.failedAt !== null) {
            const elapsed = now - keyState.failedAt;
            const cooldownMs = keyState.isQuotaError
                ? BACKOFF_CONFIG.QUOTA_COOLDOWN_MS
                : BACKOFF_CONFIG.TRANSIENT_COOLDOWN_MS;
            return elapsed < cooldownMs;
        }

        return false;
    }

    /**
     * Check if a key has exceeded max consecutive failures.
     */
    public isKeyExhausted(key: string): boolean {
        const keyState = this.keys.find(k => k.key === key);
        return keyState ? keyState.failCount >= BACKOFF_CONFIG.MAX_CONSECUTIVE_FAILURES : true;
    }

    /**
     * Get health score for a key (0-100).
     * Higher is better, based on success ratio.
     */
    public getHealthScore(key: string): number {
        const keyState = this.keys.find(k => k.key === key);
        if (!keyState || keyState.totalRequests === 0) return 100; // New keys get full score
        return Math.round((keyState.successCount / keyState.totalRequests) * 100);
    }

    /**
     * Get the next available API key using Least Recently Used (LRU) strategy.
     * Prioritizes:
     * 1. Keys that are available (not on cooldown, not exhausted).
     * 2. Among available keys, pick the one used least recently.
     */
    public getKey(): string | null {
        if (this.keys.length === 0) {
            return null;
        }

        // Filter for available candidates
        const candidates = this.keys.filter(k =>
            !this.isOnCooldown(k) &&
            k.failCount < BACKOFF_CONFIG.MAX_CONSECUTIVE_FAILURES
        );

        if (candidates.length > 0) {
            // Sort by lastUsed (ascending) -> Oldest timestamp (or 0) first
            // If lastUsed is equal (e.g. both 0), sort by failCount (prefer 0 fails)
            candidates.sort((a, b) => {
                if (a.lastUsed !== b.lastUsed) {
                    return a.lastUsed - b.lastUsed;
                }
                return a.failCount - b.failCount;
            });

            const selectedKey = candidates[0];

            // Mark as used NOW logic for LRU
            selectedKey.lastUsed = Date.now();
            this.saveState(); // Persist the usage timestamp

            return selectedKey.key;
        }

        // Fallback: All keys are exhausted or on cooldown
        // Return oldest failed key to at least try something or let app handle error
        const oldestFailed = this.keys.reduce((oldest, current) => {
            const oldestTime = oldest.failedAt ?? 0;
            const currentTime = current.failedAt ?? 0;
            return currentTime < oldestTime ? current : oldest;
        });

        logger.warn(`[ApiKeyManager] All keys on cooldown/exhausted. Fallback to: ...${oldestFailed.key.slice(-4)}`);
        return oldestFailed.key;
    }

    /**
     * Mark a key as failed. It will be avoided for the cooldown period.
     * @param key - The API key that failed
     * @param isQuotaError - True if the error was a 429 quota error (longer cooldown)
     */
    public markFailed(key: string, isQuotaError: boolean = false): void {
        const keyState = this.keys.find(k => k.key === key);
        if (keyState) {
            keyState.failedAt = Date.now();
            keyState.failCount++;
            keyState.totalRequests++;
            keyState.isQuotaError = isQuotaError;
            keyState.lastBackoffDelay = this.calculateBackoff(keyState.failCount);

            // Circuit breaker: if in HALF_OPEN and failed, go back to OPEN
            if (keyState.circuitState === 'HALF_OPEN') {
                keyState.circuitState = 'OPEN';
                keyState.halfOpenTestTime = Date.now() + BACKOFF_CONFIG.HALF_OPEN_TEST_INTERVAL_MS;
                logger.warn(`[ApiKeyManager] Key ...${key.slice(-4)} failed in HALF_OPEN → circuit OPEN`);
            }

            const isExhausted = keyState.failCount >= BACKOFF_CONFIG.MAX_CONSECUTIVE_FAILURES;

            // Circuit breaker: transition to OPEN when exhausted
            if (isExhausted && keyState.circuitState === 'CLOSED') {
                keyState.circuitState = 'OPEN';
                keyState.halfOpenTestTime = Date.now() + BACKOFF_CONFIG.HALF_OPEN_TEST_INTERVAL_MS;
                logger.warn(`[ApiKeyManager] Key ...${key.slice(-4)} EXHAUSTED → circuit OPEN`);
            }

            const cooldownType = isQuotaError ? '5min quota' : '1min transient';
            logger.warn(
                `[ApiKeyManager] Key ...${key.slice(-4)} marked as failed ` +
                `(count: ${keyState.failCount}/${BACKOFF_CONFIG.MAX_CONSECUTIVE_FAILURES}, ` +
                `${cooldownType} cooldown${isExhausted ? ' - EXHAUSTED' : ''})`
            );

            this.saveState();
        }
    }

    /**
     * Mark a key as successful. Resets failure state and improves health score.
     * Also resets circuit breaker to CLOSED state.
     */
    public markSuccess(key: string): void {
        const keyState = this.keys.find(k => k.key === key);
        if (keyState) {
            // Circuit breaker: reset to CLOSED on success
            if (keyState.circuitState !== 'CLOSED') {
                logger.info(`[ApiKeyManager] Key ...${key.slice(-4)} circuit → CLOSED (recovered)`);
            }

            // Reset failure tracking on success
            if (keyState.failedAt !== null || keyState.failCount > 0) {
                logger.info(`[ApiKeyManager] Key ...${key.slice(-4)} recovered after ${keyState.failCount} failures`);
            }
            keyState.failedAt = null;
            keyState.failCount = 0;
            keyState.retryAfter = null;
            keyState.lastBackoffDelay = 0;
            keyState.isQuotaError = false;
            keyState.circuitState = 'CLOSED';
            keyState.halfOpenTestTime = null;
            keyState.successCount++;
            keyState.totalRequests++;

            // NOTE: We do NOT update lastUsed here, because it was updated in getKey()
            // updating it here would be redundant, or could skew data if we call markSuccess multiple times.

            this.saveState();
        }
    }

    /**
     * Check if any keys are available.
     */
    public hasKeys(): boolean {
        return this.keys.length > 0;
    }

    /**
     * Get the count of configured keys.
     */
    public getKeyCount(): number {
        return this.keys.length;
    }

    /**
     * Get count of healthy (non-exhausted) keys.
     */
    public getHealthyKeyCount(): number {
        return this.keys.filter(k => k.failCount < BACKOFF_CONFIG.MAX_CONSECUTIVE_FAILURES).length;
    }

    /**
     * Get diagnostics for debugging.
     */
    public getDiagnostics(): { total: number; healthy: number; onCooldown: number; exhausted: number } {
        const total = this.keys.length;
        const exhausted = this.keys.filter(k => k.failCount >= BACKOFF_CONFIG.MAX_CONSECUTIVE_FAILURES).length;
        const onCooldown = this.keys.filter(k => this.isOnCooldown(k)).length;
        const healthy = total - exhausted - onCooldown;
        return { total, healthy, onCooldown, exhausted };
    }

    /**
     * Utility: Sleep for the backoff duration of a specific key.
     * Returns Promise that resolves after the delay.
     */
    public async waitForBackoff(key: string): Promise<void> {
        const delay = this.getBackoffDelay(key);
        logger.info(`[ApiKeyManager] Waiting ${delay}ms before retry...`);
        return new Promise(resolve => setTimeout(resolve, delay));
    }
}

// Export a singleton instance
export const apiKeyManager = new ApiKeyManager();

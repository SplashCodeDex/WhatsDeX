import { describe, it, expect, vi } from 'vitest';
import { ApiKeyManager } from './ApiKeyManager';

describe('ApiKeyManager', () => {
    let manager: ApiKeyManager;

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.clear();
        }
    });

    it('should load keys from constructor', () => {
        manager = new ApiKeyManager(['key1', 'key2', 'key3']);
        expect(manager.getKeyCount()).toBe(3);
        expect(manager.getKey()).toBe('key1');
    });

    it('should rotate keys on failure', () => {
        manager = new ApiKeyManager(['key1', 'key2']);
        const firstKey = manager.getKey();
        expect(firstKey).toBe('key1');

        manager.markFailed(firstKey!, false); // Mark key1 failed (non-quota)

        const secondKey = manager.getKey();
        expect(secondKey).toBe('key2'); // Should rotate to key2
    });

    it('should prioritize healthy keys over failed ones', () => {
        manager = new ApiKeyManager(['key1', 'key2']);

        // Fail key1 once
        manager.markFailed('key1', false);

        // Should fetch key2 because it has 0 failures
        expect(manager.getKey()).toBe('key2');
    });

    it('should respect quota cooldowns (longer wait)', () => {
        manager = new ApiKeyManager(['key1']);

        // Mark as Quota Error (429) => 5 min cooldown
        manager.markFailed('key1', true);

        const diag = manager.getDiagnostics();
        expect(diag.onCooldown).toBe(1);
    });

    it('should recover key after markSuccess', () => {
        manager = new ApiKeyManager(['key1']);

        manager.markFailed('key1', false);
        const diagBefore = manager.getDiagnostics();
        expect(diagBefore.onCooldown).toBe(1); // 1 min cooldown

        manager.markSuccess('key1');
        const diagAfter = manager.getDiagnostics();
        expect(diagAfter.onCooldown).toBe(0);
        expect(diagAfter.healthy).toBe(1);
    });

    it('should fall back to oldest failed key if all are failing but not exhausted', () => {
        manager = new ApiKeyManager(['key1', 'key2']);

        // Mock Date.now to control timing
        const now = 1000000;
        vi.useFakeTimers();
        vi.setSystemTime(now);

        // Fail key1 at T
        manager.markFailed('key1', false);

        // Advance time slightly
        vi.setSystemTime(now + 100);

        // Fail key2 at T+100
        manager.markFailed('key2', false);

        // Both keys are on cooldown.
        // Fallback logic: Use oldest failed key (smallest failedAt timestamp).
        // key1.failedAt = 1000000
        // key2.failedAt = 1000100
        // 1000000 < 1000100. Should return key1.

        expect(manager.getKey()).toBe('key1');

        vi.useRealTimers();
    });
    it('should persist key state to localStorage', () => {
        const setItemSpy = vi.fn();
        const getItemSpy = vi.fn(() => null);

        vi.stubGlobal('localStorage', {
            getItem: getItemSpy,
            setItem: setItemSpy,
        });

        manager = new ApiKeyManager(['key1']);
        manager.markFailed('key1');

        expect(setItemSpy).toHaveBeenCalled();
        const stored = JSON.parse(setItemSpy.mock.calls[0][1]);
        expect(stored['key1'].failCount).toBe(1);

        vi.unstubAllGlobals();
    });

    it('should restore key state from localStorage', () => {
        const savedState = JSON.stringify({
            'key1': {
                failCount: 5,
                circuitState: 'OPEN',
                failedAt: 12345
            }
        });

        const getItemSpy = vi.fn(() => savedState);
        const setItemSpy = vi.fn();

        vi.stubGlobal('localStorage', {
            getItem: getItemSpy,
            setItem: setItemSpy,
        });

        manager = new ApiKeyManager(['key1']);
        const diag = manager.getDiagnostics();

        expect(diag.exhausted).toBe(1);
        expect(manager.isKeyExhausted('key1')).toBe(true);
        // ApiKeyManager falls back to oldest failed key even if exhausted, so it won't be null
        expect(manager.getKey()).toBe('key1');

        vi.unstubAllGlobals();
    });
    it('should rotate keys using LRU strategy (Round Robin)', async () => {
        manager = new ApiKeyManager(['k1', 'k2', 'k3']);

        // 1st call: All have lastUsed=0. Should pick k1 (first in list)
        const key1 = manager.getKey();
        expect(key1).toBe('k1');

        // Short sleep to ensure timestamp difference
        await new Promise(r => setTimeout(r, 10));

        // 2nd call: k1 has lastUsed > 0. k2, k3 have 0. Should pick k2
        const key2 = manager.getKey();
        expect(key2).toBe('k2');

        await new Promise(r => setTimeout(r, 10));

        // 3rd call: k1, k2 have > 0. k3 has 0. Should pick k3
        const key3 = manager.getKey();
        expect(key3).toBe('k3');

        await new Promise(r => setTimeout(r, 10));

        // 4th call: All have > 0. k1 was used longest ago. Should pick k1
        const key4 = manager.getKey();
        expect(key4).toBe('k1');
    });

    it('should persist lastUsed state', () => {
        // Mock localStorage
        const store: Record<string, string> = {};
        vi.stubGlobal('localStorage', {
            getItem: (k: string) => store[k] || null,
            setItem: (k: string, v: string) => { store[k] = v; }
        });

        manager = new ApiKeyManager(['persistentKey']);
        manager.getKey(); // Sets lastUsed > 0

        // Check if state was saved
        expect(Object.keys(store)).toContain('gemini_api_key_states');
        expect(store['gemini_api_key_states']).toContain('lastUsed');
        expect(store['gemini_api_key_states']).toContain('lastUsed');

        vi.unstubAllGlobals();
    });

    it('should merge state with remote storage (cross-tab sync race condition)', () => {
        const getItemSpy = vi.fn();
        const setItemSpy = vi.fn();

        // 1. Setup: Local storage has a FAILED key (from Tab B)
        const remoteState = JSON.stringify({
            'key1': {
                failCount: 5,
                circuitState: 'OPEN',
                failedAt: 999999
            }
        });

        vi.stubGlobal('localStorage', {
            getItem: getItemSpy.mockReturnValue(remoteState), // Return remote state on read
            setItem: setItemSpy
        });

        // 2. Initialize manager (simulating Tab A having it in memory)
        manager = new ApiKeyManager(['key1']);

        // 3. Tab A thinks key1 is healthy (default state) but tries to save something
        // e.g. it marks key1 as used successfully or just some other update
        // calling saveState() underneath
        manager.markSuccess('key1');

        // 4. Verify that setItem was called with the MERGED state
        // It should PRESERVE the failure from remoteState because it's "worse"
        // Even though we just marked it success locally, the merge logic should ideally
        // (depending on strategy) either respect the latest timestamp or the worst state.
        // Our implementation explicitly prioritizes "worse" state (OPEN > CLOSED).

        const savedArg = JSON.parse(setItemSpy.mock.calls[0][1]);
        expect(savedArg['key1'].circuitState).toBe('OPEN'); // Should keep it open
        expect(savedArg['key1'].failCount).toBe(5); // Should keep high fail count

        vi.unstubAllGlobals();
    });

    it('should update state on storage event', () => {
        const events: Record<string, (e: StorageEvent) => void> = {};
        vi.stubGlobal('window', {
            addEventListener: (event: string, cb: (e: StorageEvent) => void) => {
                events[event] = cb;
            },
            localStorage: {
                getItem: vi.fn(),
                setItem: vi.fn()
            }
        });

        manager = new ApiKeyManager(['key1']);

        // Spy on loadState (private) or check public side effect
        // We'll check via public diagnostics or internal state access if possible.
        // Or check if it calls localStorage.getItem provided by us.

        const getItemSpy = vi.fn().mockReturnValue(JSON.stringify({
            'key1': { failCount: 10 }
        }));
        vi.stubGlobal('localStorage', { getItem: getItemSpy, setItem: vi.fn() });

        // Trigger storage event
        if (events['storage']) {
            events['storage']({ key: 'gemini_api_key_states' } as StorageEvent);
        }

        expect(getItemSpy).toHaveBeenCalled();
        expect(manager.isKeyExhausted('key1')).toBe(true);

        vi.unstubAllGlobals();
    });
});

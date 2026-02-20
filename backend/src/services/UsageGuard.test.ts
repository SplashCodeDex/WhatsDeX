import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsageGuard } from './UsageGuard';

describe('UsageGuard', () => {
    let guard: UsageGuard;

    beforeEach(() => {
        guard = UsageGuard.getInstance();
    });

    it('should allow sending if within Starter limit (1000)', () => {
        expect(guard.canSend('starter', 500)).toBe(true);
        expect(guard.canSend('starter', 1000)).toBe(false);
    });

    it('should allow sending if within Pro limit (10000)', () => {
        expect(guard.canSend('pro', 9999)).toBe(true);
        expect(guard.canSend('pro', 10000)).toBe(false);
    });

    it('should allow sending for Enterprise (effectively unlimited)', () => {
        expect(guard.canSend('enterprise', 1000000)).toBe(true);
    });
});

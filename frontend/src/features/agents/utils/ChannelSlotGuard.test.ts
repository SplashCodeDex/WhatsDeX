import { describe, it, expect } from 'vitest';
import { canAddChannelSlot } from './ChannelSlotGuard';

describe('ChannelSlotGuard', () => {
    it('should allow 1 channel for Starter plan', () => {
        expect(canAddChannelSlot('starter', 0)).toBe(true);
        expect(canAddChannelSlot('starter', 1)).toBe(false);
    });

    it('should allow 3 channels for Pro plan', () => {
        expect(canAddChannelSlot('pro', 2)).toBe(true);
        expect(canAddChannelSlot('pro', 3)).toBe(false);
    });

    it('should allow many channels for Enterprise plan', () => {
        expect(canAddChannelSlot('enterprise', 10)).toBe(true);
        expect(canAddChannelSlot('enterprise', 99)).toBe(true);
    });
});

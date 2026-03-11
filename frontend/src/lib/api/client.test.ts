import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api } from './client';
import { ROUTES } from '../constants/routes';

describe('apiClient', () => {
    let postMessageSpy: any;

    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
        vi.stubGlobal('window', {
            location: { pathname: '/dashboard' }
        });
        postMessageSpy = vi.spyOn(BroadcastChannel.prototype, 'postMessage');
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('should broadcast LOGOUT if silent refresh fails while on dashboard', async () => {
        // 1st call: 401
        (fetch as any).mockResolvedValueOnce({
            status: 401,
            ok: false,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({ error: 'auth_required' }),
        });

        // 2nd call (refresh): 401
        (fetch as any).mockResolvedValueOnce({
            status: 401,
            ok: false,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({ error: 'refresh_failed' }),
        });

        await api.get('/api/test');

        expect(postMessageSpy).toHaveBeenCalledWith({ type: 'LOGOUT' });
    });

    it('should NOT broadcast LOGOUT if silent refresh fails while already on login page', async () => {
        vi.stubGlobal('window', {
            location: { pathname: ROUTES.LOGIN }
        });

        // 1st call: 401
        (fetch as any).mockResolvedValueOnce({
            status: 401,
            ok: false,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({ error: 'auth_required' }),
        });

        // 2nd call (refresh): 401
        (fetch as any).mockResolvedValueOnce({
            status: 401,
            ok: false,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({ error: 'refresh_failed' }),
        });

        await api.get('/api/test');

        // Should NOT have broadcasted LOGOUT
        const logoutCalls = postMessageSpy.mock.calls.filter((args: any[]) => args[0].type === 'LOGOUT');
        expect(logoutCalls.length).toBe(0);
    });
});

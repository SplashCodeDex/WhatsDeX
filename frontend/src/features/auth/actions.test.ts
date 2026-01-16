import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signUp } from './actions';
import { registerSchema } from './schemas';

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: () => ({
    set: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  }),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

global.fetch = vi.fn();

describe('signUp Server Action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock a successful fetch response
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ user: { id: '123' }, token: 'fake-token' }),
    });
  });

  it('should include tenantName and subdomain in the API payload', async () => {
    const formData = new FormData();
    formData.append('firstName', 'John');
    formData.append('lastName', 'Doe');
    formData.append('email', 'john@example.com');
    formData.append('password', 'Password123');
    formData.append('acceptTerms', 'on');
    formData.append('tenantName', 'My Company');
    formData.append('subdomain', 'my-company');

    await signUp(formData);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/register'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: 'John Doe',
          email: 'john@example.com',
          password: 'Password123',
          tenantName: 'My Company',
          subdomain: 'my-company',
        }),
      })
    );
  });
});

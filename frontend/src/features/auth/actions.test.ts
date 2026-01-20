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
    (global.fetch as vi.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { user: {}, token: 'fake-token' } }),
    });
  });

  it('should send firstName and lastName to the backend', async () => {
    const formData = new FormData();
    formData.append('firstName', 'John');
    formData.append('lastName', 'Doe');
    formData.append('email', 'john@example.com');
    formData.append('password', 'Password123');
    formData.append('acceptTerms', 'on');

    await signUp(formData);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/register'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"firstName":"John"'),
      })
    );

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/register'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"lastName":"Doe"'),
      })
    );
  });
});

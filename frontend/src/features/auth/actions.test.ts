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
  });

  it('should send the correct payload to the backend', async () => {
    const formData = new FormData();
    formData.append('firstName', 'John');
    formData.append('lastName', 'Doe');
    formData.append('email', 'john@example.com');
    formData.append('password', 'Password123');
    formData.append('acceptTerms', 'on');

    // Mock the fetch response
    (global.fetch as vi.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ user: { id: '123' }, token: 'abc' }),
    });

    await signUp(formData);

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/auth/register',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"displayName":"John Doe"'),
      })
    );
  });
});

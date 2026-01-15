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

  it('should include tenantName and subdomain in the API payload', async () => {
    const formData = new FormData();
    formData.append('firstName', 'John');
    formData.append('lastName', 'Doe');
    formData.append('email', 'john@example.com');
    formData.append('password', 'Password123');
    formData.append('acceptTerms', 'on');
    // These fields are currently missing in the implementation
    formData.append('tenantName', 'My Company');
    formData.append('subdomain', 'my-company');

    await signUp(formData);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/register'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"tenantName":"My Company"'),
      })
    );

    expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/register'),
        expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"subdomain":"my-company"'),
        })
    );
    
    expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/register'),
        expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"name":"John Doe"'),
        })
    );
  });
});

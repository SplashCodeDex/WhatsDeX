import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signIn, signUp } from './actions';
import { api, API_ENDPOINTS } from '@/lib/api';
import { isApiSuccess, isApiError } from '@/types/api';

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

// Mock api client
vi.mock('@/lib/api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  },
  API_ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
    },
  },
}));

describe('Auth Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signIn', () => {
    it('should return success Result on valid credentials', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      const mockToken = 'mock-token';

      (api.post as any).mockResolvedValue({
        success: true,
        data: { user: mockUser, token: mockToken },
      });

      const formData = new FormData();
      formData.append('email', 'test@example.com');
      formData.append('password', 'password123');

      const result = await signIn(null, formData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockUser);
        expect(result.message).toBe('Signed in successfully');
      }
    });

    it('should return error Result on api failure', async () => {
      (api.post as any).mockResolvedValue({
        success: false,
        error: { code: 'auth_error', message: 'Invalid credentials' },
      });

      const formData = new FormData();
      formData.append('email', 'test@example.com');
      formData.append('password', 'wrongpassword');

      const result = await signIn(null, formData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('auth_error');
        expect(result.error.message).toBe('Invalid credentials');
      }
    });

    it('should return validation error on invalid input', async () => {
        const formData = new FormData();
        formData.append('email', 'invalid-email');
        formData.append('password', '123');
  
        const result = await signIn(null, formData);
  
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe('validation_error');
          expect(result.error.details).toBeDefined();
          expect(result.error.details?.field).toBeDefined();
        }
      });
  });

  describe('signUp', () => {
    it('should return success Result on valid registration', async () => {
      const mockUser = { id: '1', email: 'new@example.com', name: 'John Doe' };
      const mockToken = 'mock-token';

      (api.post as any).mockResolvedValue({
        success: true,
        data: { user: mockUser, token: mockToken },
      });

      const formData = new FormData();
      formData.append('firstName', 'John');
      formData.append('lastName', 'Doe');
      formData.append('email', 'new@example.com');
      formData.append('password', 'Password123');
      formData.append('acceptTerms', 'on');

      const result = await signUp(null, formData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockUser);
      }
    });
  });
});
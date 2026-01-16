// Mock file for Vitest
import { vi } from 'vitest';

// Set environment variables for testing
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000';

// Mock Next.js modules
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  redirect: vi.fn(),
}));

vi.mock('next/headers', () => ({
    cookies: () => ({
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
    }),
}));

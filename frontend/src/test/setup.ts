// src/test/setup.ts
import { vi } from 'vitest';

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000';

// Mocks for Next.js modules can be centralized here if needed
// For now, mocks in the test file are sufficient.

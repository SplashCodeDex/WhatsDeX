import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authenticateToken } from './authMiddleware.js';
import jwt from 'jsonwebtoken';
import { ConfigService } from '../services/ConfigService.js';

// Mock ConfigService
vi.mock('../services/ConfigService.js', () => {
  const mockGet = vi.fn((key: string) => {
    if (key === 'JWT_SECRET') return 'test-secret';
    return null;
  });
  return {
    ConfigService: {
      getInstance: () => ({
        get: mockGet,
      }),
    },
  };
});

// Mock jsonwebtoken
vi.mock('jsonwebtoken');

// Mock logger
vi.mock('../utils/logger.js', () => ({
  default: {
    security: vi.fn(),
    error: vi.fn(),
  },
}));

describe('authMiddleware', () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      headers: {},
      cookies: {},
      ip: '127.0.0.1'
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should return 401 if no token is provided', async () => {
    await authenticateToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Access token required' });
  });

  it('should return 403 if token verification fails', async () => {
    req.headers['authorization'] = 'Bearer invalid-token';
    // mock jwt.verify to throw error
    vi.mocked(jwt.verify).mockImplementation(() => {
      throw new Error('Invalid token');
    });

    await authenticateToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Invalid or unauthorized token' });
  });

  it('should return 401 if token is expired', async () => {
    req.headers['authorization'] = 'Bearer expired-token';
    vi.mocked(jwt.verify).mockImplementation(() => {
      const err = new Error('jwt expired');
      err.name = 'TokenExpiredError';
      throw err;
    });

    await authenticateToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Token expired' });
  });

  it('should call next() and populate req.user if token is valid', async () => {
    req.headers['authorization'] = 'Bearer valid-token';
    const decodedUser = { userId: 'user-123', email: 'test@example.com', tenantId: 'tenant-abc', role: 'user', iat: 123, exp: 456 };
    vi.mocked(jwt.verify).mockReturnValue(decodedUser as any);

    await authenticateToken(req, res, next);
    expect(req.user).toBeDefined();
    expect(req.user).toEqual(decodedUser);
    expect(next).toHaveBeenCalled();
  });
});
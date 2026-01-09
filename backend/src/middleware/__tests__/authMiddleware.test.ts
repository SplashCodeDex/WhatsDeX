import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authenticateToken } from '../authMiddleware.js';

// Mock dependencies
const mockVerifyIdToken = vi.fn();
vi.mock('../../lib/firebase.js', () => ({
  auth: {
    verifyIdToken: (token: string) => mockVerifyIdToken(token),
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
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
  });

  it('should return 401 if no token is provided', async () => {
    await authenticateToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Access token required' });
  });

  it('should return 403 if token verification fails', async () => {
    req.headers['authorization'] = 'Bearer invalid-token';
    mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));

    await authenticateToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('should call next() and populate req.user if token is valid', async () => {
    req.headers['authorization'] = 'Bearer valid-token';
    const decodedUser = { uid: 'user-123', email: 'test@example.com', tenantId: 'tenant-abc' };
    mockVerifyIdToken.mockResolvedValue(decodedUser);

    await authenticateToken(req, res, next);
    expect(req.user).toBeDefined();
    expect(req.user.uid).toBe('user-123');
    expect(next).toHaveBeenCalled();
  });
});

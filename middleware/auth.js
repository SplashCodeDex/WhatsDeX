const jwt = require('jsonwebtoken');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const logger = require('../src/utils/logger');

// Rate limiter for auth endpoints
const authRateLimiter = new RateLimiterMemory({
  keyPrefix: 'auth',
  points: 10, // Number of requests
  duration: 60, // Per 60 seconds
});

/**
 * JWT Authentication Middleware
 * Verifies JWT token and attaches user info to request
 */
const authenticateToken = async (req, res, next) => {
  try {
    // IP whitelisting check (consolidated)
    const devIPs = ['127.0.0.1', '::1', '0.0.0.0'];
    const isDevIP = devIPs.includes(req.ip);
    const isWhitelisted =
      isDevIP ||
      (process.env.WHITELIST_IPS && process.env.WHITELIST_IPS.split(',').includes(req.ip));
    if (!isWhitelisted) {
      require('../src/services/auditLogger').warn('IP not whitelisted', {
        ip: req.ip,
        endpoint: req.path,
      });
      return res.status(403).json({ error: 'IP address not whitelisted' });
    }

    await authRateLimiter.consume(req.ip);

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        code: 'AUTH_TOKEN_MISSING',
      });
    }

    // Verify token
    jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret', async (err, decoded) => {
      if (err) {
        logger.warn('JWT verification failed', {
          error: err.message,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        });

        return res.status(403).json({
          error: 'Invalid or expired token',
          code: 'AUTH_TOKEN_INVALID',
        });
      }

      // Attach user info to request
      req.user = {
        id: decoded.userId,
        role: decoded.role || 'admin',
        permissions: decoded.permissions || [],
      };

      // Log successful authentication
      logger.info('User authenticated', {
        userId: req.user.id,
        role: req.user.role,
        ip: req.ip,
        endpoint: req.path,
        method: req.method,
      });

      next();
    });
  } catch (rateLimitError) {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      endpoint: req.path,
    });

    return res.status(429).json({
      error: 'Too many authentication attempts',
      code: 'AUTH_RATE_LIMIT',
    });
  }
};

/**
 * Role-based Authorization Middleware
 * Checks if user has required role/permission
 */
const authorize =
  (requiredRole, requiredPermissions = []) =>
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    const userRole = req.user.role;
    const userPermissions = req.user.permissions || [];

    // Check role hierarchy (admin > moderator > viewer)
    const roleHierarchy = {
      viewer: 1,
      moderator: 2,
      admin: 3,
      superadmin: 4,
    };

    const userRoleLevel = roleHierarchy[userRole] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

    // Check if user has sufficient role level
    if (userRoleLevel < requiredRoleLevel) {
      logger.warn('Insufficient role permissions', {
        userId: req.user.id,
        userRole,
        requiredRole,
        endpoint: req.path,
      });

      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'AUTH_INSUFFICIENT_ROLE',
      });
    }

    // Check specific permissions if required
    if (requiredPermissions.length > 0) {
      const hasAllPermissions = requiredPermissions.every(permission =>
        userPermissions.includes(permission)
      );

      if (!hasAllPermissions) {
        logger.warn('Missing required permissions', {
          userId: req.user.id,
          userPermissions,
          requiredPermissions,
          endpoint: req.path,
        });

        return res.status(403).json({
          error: 'Missing required permissions',
          code: 'AUTH_MISSING_PERMISSIONS',
        });
      }
    }

    next();
  };

/**
 * Admin-only middleware
 */
const requireAdmin = authorize('admin');

/**
 * Moderator or higher middleware
 */
const requireModerator = authorize('moderator');

/**
 * Super admin only middleware
 */
const requireSuperAdmin = authorize('superadmin');

/**
 * Permission-based middleware factory
 */
const requirePermission = permission => authorize('viewer', [permission]);

/**
 * Optional authentication middleware
 * Attaches user info if token is present, but doesn't fail if missing
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret', (err, decoded) => {
        if (!err) {
          req.user = {
            id: decoded.userId,
            role: decoded.role || 'viewer',
            permissions: decoded.permissions || [],
          };
        }
      });
    }

    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};

/**
 * API Key authentication for service-to-service calls
 */
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;

  if (!apiKey) {
    return res.status(401).json({
      error: 'API key required',
      code: 'API_KEY_MISSING',
    });
  }

  // Verify API key (implement your key verification logic)
  const validKeys = process.env.VALID_API_KEYS ? process.env.VALID_API_KEYS.split(',') : [];

  if (!validKeys.includes(apiKey)) {
    logger.warn('Invalid API key used', {
      ip: req.ip,
      endpoint: req.path,
      providedKey: `${apiKey.substring(0, 8)}...`, // Log partial key for debugging
    });

    return res.status(403).json({
      error: 'Invalid API key',
      code: 'API_KEY_INVALID',
    });
  }

  req.apiKey = apiKey;
  next();
};

module.exports = {
  authenticateToken,
  authorize,
  requireAdmin,
  requireModerator,
  requireSuperAdmin,
  requirePermission,
  optionalAuth,
  authenticateApiKey,
};

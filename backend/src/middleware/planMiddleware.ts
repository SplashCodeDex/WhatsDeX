import { Request, Response, NextFunction } from 'express';
import { multiTenantService } from '@/services/multiTenantService.js';
import logger from '@/utils/logger.js';

/**
 * Middleware to check if user has reached their bot limit
 */
export const checkBotLimit = async (req: Request, res: Response, next: NextFunction) => {
  const tenantId = req.user?.tenantId;

  if (!tenantId) {
    return res.status(401).json({ error: 'Tenant context missing' });
  }

  try {
    const result = await multiTenantService.canAddBot(tenantId);
    
    if (!result.success) {
      throw result.error;
    }

    if (!result.data) {
      return res.status(403).json({ 
        error: 'Bot limit reached',
        code: 'LIMIT_REACHED',
        suggestion: 'Upgrade your plan to add more bots.'
      });
    }

    next();
  } catch (error) {
    logger.error('PlanMiddleware.checkBotLimit error:', error);
    res.status(500).json({ error: 'Failed to verify plan limits' });
  }
};

/**
 * Middleware to check access to premium features (AI, Backups)
 */
export const checkFeatureAccess = (feature: 'ai' | 'backups' | 'broadcast') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context missing' });
    }

    try {
      const tenantResult = await multiTenantService.getTenant(tenantId);
      if (!tenantResult.success) throw tenantResult.error;

      const tenant = tenantResult.data;
      const plan = tenant.planTier || 'starter';

      let hasAccess = false;

      switch (feature) {
        case 'ai':
          hasAccess = plan !== 'starter';
          break;
        case 'backups':
          hasAccess = true; // Included in all tiers per updated spec
          break;
        case 'broadcast':
          hasAccess = true; // All tiers have it, but with different limits (enforced elsewhere)
          break;
      }

      if (!hasAccess) {
        return res.status(403).json({ 
          error: `Feature '${feature}' requires a higher plan`,
          code: 'UPGRADE_REQUIRED'
        });
      }

      next();
    } catch (error) {
      logger.error('PlanMiddleware.checkFeatureAccess error:', error);
      res.status(500).json({ error: 'Failed to verify feature access' });
    }
  };
};

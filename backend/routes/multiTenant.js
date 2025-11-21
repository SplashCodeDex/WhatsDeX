import express from 'express';
import multiTenantService from '../src/services/multiTenantService.js';
import multiTenantStripeService from '../src/services/multiTenantStripeService.js';

const router = express.Router();

// Authentication middleware for internal API
const authenticateInternalAPI = (req, res, next) => {
  const apiKey = req.headers['x-internal-api-key'];
  const expectedKey = process.env.INTERNAL_API_KEY || 'internal-api-key-change-in-production';
  
  if (!apiKey || apiKey !== expectedKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
};

// Apply authentication to all routes
router.use(authenticateInternalAPI);

// Tenant Management Routes
router.post('/tenants', async (req, res) => {
  try {
    const result = await multiTenantService.createTenant(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/tenants/:identifier', async (req, res) => {
  try {
    const tenant = await multiTenantService.getTenant(req.params.identifier);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    res.json({ success: true, data: tenant });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/tenants/:tenantId', async (req, res) => {
  try {
    const tenant = await multiTenantService.updateTenant(req.params.tenantId, req.body);
    res.json({ success: true, data: tenant });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Authentication Routes
router.post('/auth/authenticate', async (req, res) => {
  try {
    const { tenantId, email, password } = req.body;
    const result = await multiTenantService.authenticateUser(tenantId, email, password);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// User Management Routes
router.post('/tenants/:tenantId/users', async (req, res) => {
  try {
    const user = await multiTenantService.createTenantUser(req.params.tenantId, req.body);
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Bot Management Routes
router.post('/tenants/:tenantId/bots', async (req, res) => {
  try {
    const bot = await multiTenantService.createBotInstance(req.params.tenantId, req.body);
    res.json({ success: true, data: bot });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/tenants/:tenantId/bots', async (req, res) => {
  try {
    const tenant = await multiTenantService.getTenant(req.params.tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    const result = {
      bots: tenant.botInstances || [],
      limits: JSON.parse(tenant.planLimits || '{}'),
      plan: tenant.plan
    };
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/bots/:botId/status', async (req, res) => {
  try {
    const { status, sessionData } = req.body;
    const bot = await multiTenantService.updateBotStatus(req.params.botId, status, sessionData);
    res.json({ success: true, data: bot });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Analytics Routes
router.post('/tenants/:tenantId/analytics', async (req, res) => {
  try {
    const { metric, value, metadata } = req.body;
    await multiTenantService.recordAnalytic(req.params.tenantId, metric, value, metadata);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/tenants/:tenantId/analytics', async (req, res) => {
  try {
    const { metrics, startDate, endDate } = req.query;
    const metricsArray = metrics ? metrics.split(',') : [];
    const analytics = await multiTenantService.getAnalytics(
      req.params.tenantId,
      metricsArray,
      startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate ? new Date(endDate) : new Date()
    );
    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Audit Log Routes
router.post('/tenants/:tenantId/audit-logs', async (req, res) => {
  try {
    const { userId, action, resource, resourceId, details, ipAddress, userAgent } = req.body;
    await multiTenantService.logAction(
      req.params.tenantId,
      userId,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Plan Management Routes
router.get('/tenants/:tenantId/plan-limits/:resource', async (req, res) => {
  try {
    const limits = await multiTenantService.checkPlanLimits(req.params.tenantId, req.params.resource);
    res.json({ success: true, data: limits });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/tenants/:tenantId/usage/:resource', async (req, res) => {
  try {
    const usage = await multiTenantService.getCurrentUsage(req.params.tenantId, req.params.resource);
    res.json({ success: true, data: { usage } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API Key Management Routes
router.post('/tenants/:tenantId/api-keys', async (req, res) => {
  try {
    const { name } = req.body;
    const apiKey = await multiTenantService.createApiKey(req.params.tenantId, name);
    res.json({ success: true, data: apiKey });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/validate-api-key', async (req, res) => {
  try {
    const { apiKey } = req.body;
    const result = await multiTenantService.validateApiKey(apiKey);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// Stripe Service Routes
router.get('/stripe/plans', async (req, res) => {
  try {
    const plans = multiTenantStripeService.getAllPlans();
    res.json({ success: true, data: plans });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/tenants/:tenantId/stripe/customers', async (req, res) => {
  try {
    const customer = await multiTenantStripeService.createCustomer(req.params.tenantId, req.body);
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/tenants/:tenantId/subscription', async (req, res) => {
  try {
    const subscription = await multiTenantStripeService.getSubscriptionInfo(req.params.tenantId);
    res.json({ success: true, data: subscription });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/stripe/webhook', async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    const result = await multiTenantStripeService.handleWebhook(req.body, signature);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
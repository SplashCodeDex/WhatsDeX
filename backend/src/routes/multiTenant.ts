import express from 'express';
import multiTenantService from '../services/multiTenantService.js';

const router = express.Router();

router.get('/status', (req: any, res: any) => {
    res.json({ status: 'ok', message: 'Internal API operational' });
});

// Bot Management Routes
router.post('/tenants/:tenantId/bots', async (req: any, res: any) => {
    try {
        const bot = await multiTenantService.createBotInstance(req.params.tenantId, req.body);
        res.json({ success: true, data: bot });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/tenants/:tenantId/bots', async (req: any, res: any) => {
    try {
        const tenant = await multiTenantService.getTenant(req.params.tenantId);
        if (!tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }
        res.json({ success: true, data: tenant.botInstances || [] });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;

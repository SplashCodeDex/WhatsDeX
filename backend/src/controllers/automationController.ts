import { Request, Response } from 'express';
import { automationService } from '../services/automationService.js';
import logger from '../utils/logger.js';

export class AutomationController {
    static async createAutomation(req: Request, res: Response) {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) return res.status(401).json({ success: false, error: 'Unauthorized' });

            const result = await automationService.createAutomation(tenantId, req.body);
            if (result.success) {
                res.status(201).json(result);
            } else {
                res.status(500).json(result);
            }
        } catch (error: any) {
            logger.error('AutomationController.createAutomation error', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    static async listAutomations(req: Request, res: Response) {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) return res.status(401).json({ success: false, error: 'Unauthorized' });

            const result = await automationService.listAutomations(tenantId);
            res.json(result);
        } catch (error: any) {
            logger.error('AutomationController.listAutomations error', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    static async toggleAutomation(req: Request, res: Response) {
        try {
            const tenantId = req.user?.tenantId;
            const { id } = req.params;
            const { isActive } = req.body;
            if (!tenantId) return res.status(401).json({ success: false, error: 'Unauthorized' });

            const result = await automationService.toggleAutomation(tenantId, id, isActive);
            res.json(result);
        } catch (error: any) {
            logger.error('AutomationController.toggleAutomation error', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }
}

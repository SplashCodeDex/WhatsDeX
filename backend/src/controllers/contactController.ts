import { Request, Response } from 'express';
import { ContactService } from '../services/contactService.js';
import logger from '../utils/logger.js';

export const importContactsController = async (req: Request, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const { csvData } = req.body;
        if (!csvData) {
            return res.status(400).json({ success: false, error: 'csvData is required' });
        }

        const service = ContactService.getInstance();
        const result = await service.importContacts(tenantId, csvData);

        if (result.success) {
            return res.json(result);
        } else {
            logger.error('Import contacts failed', result.error);
            return res.status(500).json({ success: false, error: 'Failed to import contacts' });
        }
    } catch (error: any) {
        logger.error('importContactsController error', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

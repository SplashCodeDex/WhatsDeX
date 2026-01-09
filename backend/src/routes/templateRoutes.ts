import express from 'express';
import templateService from '../services/templateService.js';

const router = express.Router();

router.get('/', async (req: any, res: any) => {
    try {
        const templates = await templateService.getTemplates();
        res.json({ success: true, data: templates });
    } catch (error: any) {
        res.status(500).json({ success: false, error: 'Failed to fetch templates' });
    }
});

export default router;

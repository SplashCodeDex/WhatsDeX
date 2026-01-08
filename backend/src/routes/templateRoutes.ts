import express from 'express';
import templateService from '../services/templateService';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const templates = await templateService.getTemplates();
        res.json({ success: true, data: templates });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch templates' });
    }
});

export default router;

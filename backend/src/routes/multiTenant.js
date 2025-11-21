import express from 'express';

const router = express.Router();

router.get('/status', (req, res) => {
    res.json({ status: 'ok', message: 'Internal API operational' });
});

export default router;

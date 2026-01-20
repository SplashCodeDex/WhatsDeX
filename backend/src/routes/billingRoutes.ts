import { Router } from 'express';
import { createCheckoutSession } from '../controllers/billingController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/checkout', authenticateToken, createCheckoutSession);

export default router;
